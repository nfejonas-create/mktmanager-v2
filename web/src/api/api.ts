import axios from 'axios';

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

// Add request interceptor for auth if needed
api.interceptors.request.use((config) => {
  // Add userId to all requests for now (single user mode)
  if (config.params) {
    config.params.userId = config.params.userId || 'default';
  } else {
    config.params = { userId: 'default' };
  }
  return config;
});

export default api;
