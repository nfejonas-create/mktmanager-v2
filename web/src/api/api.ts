import axios from 'axios';

// @ts-ignore
const API_URL = import.meta.env?.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
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