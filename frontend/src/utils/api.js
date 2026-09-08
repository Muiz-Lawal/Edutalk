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

// ===== CLASS MVP APIs =====

// Get all categories
export const getCategories = async () => {
  try {
    const response = await api.get('/classes/mvp/categories');
    return response.data.categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Browse all classes with filters
export const getClasses = async (filters = {}) => {
  try {
    const { category = '', page = 1, limit = 12, search = '' } = filters;
    const params = new URLSearchParams();

    if (category && category !== 'All') params.append('category', category);
    params.append('page', page);
    params.append('limit', limit);
    if (search) params.append('search', search);

    const response = await api.get(`/classes/mvp?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching classes:', error);
    throw error;
  }
};

// Get class details by ID
export const getClassById = async (classId) => {
  try {
    const response = await api.get(`/classes/mvp/${classId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching class details:', error);
    throw error;
  }
};

// Get class schedule
export const getClassSchedule = async (classId) => {
  try {
    const response = await api.get(`/classes/mvp/${classId}/schedule`);
    return response.data;
  } catch (error) {
    console.error('Error fetching class schedule:', error);
    throw error;
  }
};

// Create a new class (Host only)
export const createClass = async (classData) => {
  try {
    const response = await api.post('/classes/mvp', classData);
    return response.data;
  } catch (error) {
    console.error('Error creating class:', error);
    throw error;
  }
};

// Update a class (Host only)
export const updateClass = async (classId, classData) => {
  try {
    const response = await api.put(`/classes/mvp/${classId}`, classData);
    return response.data;
  } catch (error) {
    console.error('Error updating class:', error);
    throw error;
  }
};

// Delete a class (Host only)
export const deleteClass = async (classId) => {
  try {
    const response = await api.delete(`/classes/mvp/${classId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting class:', error);
    throw error;
  }
};

// Get host's classes (Host only)
export const getHostClasses = async () => {
  try {
    const response = await api.get('/classes/mvp/host/my-classes');
    return response.data;
  } catch (error) {
    console.error('Error fetching host classes:', error);
    throw error;
  }
};

// Calculate pricing for given days
export const calculatePricing = async (monthlyPrice, days) => {
  try {
    const response = await api.get('/classes/mvp/pricing', {
      params: {
        monthlyPrice,
        days,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error calculating pricing:', error);
    throw error;
  }
};

export { api };
export const apiClient = api;
export default api;
