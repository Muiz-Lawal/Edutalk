import axios from 'axios';
import { recordClientTelemetry, setTelemetryTransport } from '../lib/telemetry';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const retryableMethods = new Set(['get', 'head', 'options']);

export class ApiError extends Error {
  constructor(message, { status, code, cause } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.cause = cause;
  }
}

export function friendlyError(error) {
  if (error instanceof ApiError) return error;
  const status = error?.response?.status;
  const code = error?.code;
  let message = 'We couldn’t complete that request. Please try again.';
  if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') {
    message = 'The request timed out. Please try again.';
  } else if (code === 'ERR_CANCELED') {
    message = 'The request was canceled.';
  } else if (!error?.response) {
    message = 'We couldn’t reach the server. Check your connection and try again.';
  } else if (status === 401) message = 'Your session has expired. Please sign in again.';
  else if (status === 403) message = 'You do not have permission to do that.';
  else if (status === 404) message = 'We couldn’t find what you requested.';
  else if (status >= 500) message = 'The server is having trouble. Please try again shortly.';
  return new ApiError(message, { status, code, cause: error });
}

const api = axios.create({ baseURL: API_URL, timeout: 10000 });
const sleep = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

async function fetch(input, options = {}) {
  const method = (options.method || input?.method || 'GET').toUpperCase();
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 10000);
  const sourceSignal = options.signal || (input instanceof Request ? input.signal : null);
  const abortFromSource = () => controller.abort();
  if (sourceSignal?.aborted) controller.abort();
  else sourceSignal?.addEventListener('abort', abortFromSource, { once: true });
  const headers = new Headers(options.headers || (input instanceof Request ? input.headers : undefined));
  const url = input instanceof Request ? input.url : String(input);
  let token = null;
  try {
    token = localStorage.getItem('token') || localStorage.getItem('tempToken');
  } catch {
    token = null;
  }
  if (token && url.startsWith(API_URL) && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let attempt = 0;
  try {
    while (true) {
      try {
        const response = await window.fetch(input, {
          ...options,
          headers,
          signal: controller.signal,
        });
        if (retryableMethods.has(method.toLowerCase()) && response.status >= 500 && attempt === 0) {
          attempt += 1;
          await sleep(1000);
          continue;
        }
        return response;
      } catch (error) {
        if (retryableMethods.has(method.toLowerCase()) && attempt === 0 && !controller.signal.aborted) {
          attempt += 1;
          await sleep(1000);
          continue;
        }
        if (sourceSignal?.aborted) {
          throw friendlyError({ code: 'ERR_CANCELED' });
        }
        if (controller.signal.aborted) {
          throw new ApiError('The request timed out. Please try again.', { code: 'ETIMEDOUT', cause: error });
        }
        throw friendlyError(error);
      }
    }
  } finally {
    window.clearTimeout(timer);
    sourceSignal?.removeEventListener('abort', abortFromSource);
  }
}

api.fetchResponse = fetch;

setTelemetryTransport((snapshot) => {
  api.post('/telemetry', snapshot).catch(() => console.error('Telemetry delivery failed'));
});

// Use this for requests whose lifecycle is tied to a component. It prevents
// late responses from updating unmounted screens while retaining the client
// timeout as a second safety net.
export async function request(config, { signal, timeout = 10000 } = {}) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  const abortRequest = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', abortRequest, { once: true });
  }
  try {
    return await api.request({ ...config, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener('abort', abortRequest);
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('tempToken');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    const method = (config.method || 'get').toLowerCase();
    const requestUrl = config.url || '';
    if (
      retryableMethods.has(method)
      && (!error.response || error.response.status >= 500)
      && !config.__retried
      && error.code !== 'ERR_CANCELED'
      && !requestUrl.includes('/telemetry')
    ) {
      config.__retried = true;
      await sleep(1000);
      return api.request(config);
    }
    if (error.response?.status === 401) {
      const isAdminLoginRequest = requestUrl.includes('/auth/admin/login');
      const isAdminRequest = requestUrl.includes('/admin/');
      if (!isAdminLoginRequest) {
        localStorage.removeItem('token');
        window.location.href = isAdminRequest ? '/admin/login' : '/login';
      }
    }
    if (!requestUrl.includes('/telemetry')) {
      const lowerUrl = requestUrl.toLowerCase();
      if (lowerUrl.includes('quote')) recordClientTelemetry('quote_failures', { status: error.response?.status || 0 });
      if (lowerUrl.includes('/video/') && (!error.response || error.response.status >= 500)) {
        recordClientTelemetry('provider_failures', { status: error.response?.status || 0 });
      }
    }
    return Promise.reject(friendlyError(error));
  },
);

export { api };
export const apiClient = api;
export default api;
