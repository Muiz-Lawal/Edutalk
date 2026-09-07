import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  constructor(message, { status, code, cause } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.cause = cause;
  }
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Add token to requests
api.interceptors.request.use((config) => {
  // Try to get token, fallback to tempToken (for expired password scenario)
  const token = localStorage.getItem('token') || localStorage.getItem('tempToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAdminLoginRequest = requestUrl.includes('/auth/admin/login');
      const isAdminRequest = requestUrl.includes('/admin/');

      // Failed admin credentials must be handled by AdminLoginPage so the
      // user can correct them without being sent to the public login flow.
      if (!isAdminLoginRequest) {
        localStorage.removeItem('token');
        window.location.href = isAdminRequest ? '/admin/login' : '/login';
      }
    }
    const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
    const typedError = new ApiError(
      isTimeout ? 'The request timed out.' : 'The request could not be completed.',
      { status: error.response?.status, code: isTimeout ? 'TIMEOUT' : error.code, cause: error },
    );
    console.error('API request failed', { url: error.config?.url, status: error.response?.status, error });
    return Promise.reject(typedError);
  }
);

export { api };
export const apiClient = api;
export default api;
