import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    // Super-admin routes (/admin/login, /admin/restaurants, /admin/setup, etc.)
    // use adminToken. Note: /admin/orders is a RESTAURANT route (dashboard analytics)
    // so it must use the restaurant token, not adminToken.
    const url = config.url || '';
    const isSuperAdminRoute =
      url.includes('/admin/restaurants') ||
      url.includes('/admin/login') ||
      url.includes('/admin/setup') ||
      url.includes('/admin/reset-password');

    if (isSuperAdminRoute) {
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    } else {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;

      const isAuthPage =
        path.startsWith('/admin') ||
        path === '/login' ||
        path === '/signup';

      const isLoginRequest =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/admin/login') ||
        error.config?.url?.includes('/admin/setup') ||
        error.config?.url?.includes('/admin/reset-password');

      if (!isAuthPage && !isLoginRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
