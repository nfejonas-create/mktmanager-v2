import axios from 'axios';
import { clearAuthStorage, getStoredToken } from '../contexts/AuthContext';

const rawApiUrl =
  // @ts-ignore
  import.meta.env?.VITE_API_URL ||
  // @ts-ignore
  (import.meta.env?.PROD ? 'https://postflow-backend-cspj.onrender.com/api' : '/api');

const API_URL = rawApiUrl.replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      clearAuthStorage();
      window.location.assign('/login');
    }

    return Promise.reject(error);
  }
);

export default api;
