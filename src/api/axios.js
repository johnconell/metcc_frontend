import axios from 'axios';
import { API_URL } from '../config/env';
import { tokenStorage } from '../auth/tokenStorage';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = String(error.config?.url || '');
      const isLogoutRequest = /logout/i.test(requestUrl);

      tokenStorage.remove();

      // Never force /login during logout — the app navigates to the landing page.
      if (isLogoutRequest) {
        return Promise.reject(error);
      }

      const path = window.location.pathname;
      if (path !== '/login' && path !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
