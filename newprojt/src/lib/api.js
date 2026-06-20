import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  // Default matches Vite proxy → Laravel `routes/api.php` prefix `v1`
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response: unwrap BaseController envelope; handle errors
api.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (
      payload &&
      typeof payload === 'object' &&
      payload.success === true &&
      Object.prototype.hasOwnProperty.call(payload, 'data')
    ) {
      response.data = payload.data;
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const reqUrl = error.config?.url || '';
    const isAuthRoute =
      reqUrl.includes('/login') || reqUrl.includes('/register');

    if (status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    const body = error.response?.data;
    const validationErrors = body?.errors;
    let message = body?.message || error.message || 'Une erreur est survenue';
    if (validationErrors && typeof validationErrors === 'object') {
      const first = Object.values(validationErrors).flat()[0];
      if (first) {
        message = Array.isArray(first) ? first[0] : String(first);
      }
    }
    error.standardizedMessage = message;
    
    // Global error feedback
    if (!isAuthRoute || status !== 401) {
      toast.error(message, {
        duration: 4000,
        position: 'top-right',
      });
    }

    return Promise.reject(error);
  }
);

export default api;
