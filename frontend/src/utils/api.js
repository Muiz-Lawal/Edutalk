import axios from 'axios';

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

// Use this for requests whose lifecycle is tied to a component. It prevents
// late responses from updating unmounted screens while retaining the client
// timeout as a second safety net.
export async function request(config, { signal, timeout = 10000 } = {}) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true });
  try {
    return await api.request({ ...config, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
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
    if (retryableMethods.has(method) && (!error.response || error.response.status >= 500) && !config.__retried) {
      config.__retried = true;
      return api.request(config);
    }
    if (error.response?.status === 401) {
      const requestUrl = config.url || '';
      const isAdminLoginRequest = requestUrl.includes('/auth/admin/login');
      const isAdminRequest = requestUrl.includes('/admin/');
      if (!isAdminLoginRequest) {
        localStorage.removeItem('token');
        window.location.href = isAdminRequest ? '/admin/login' : '/login';
      }
    }
    console.error('API request failed', { url: config.url, status: error.response?.status, error });
    return Promise.reject(friendlyError(error));
  },
);

export { api };
export const apiClient = api;
export default api;
