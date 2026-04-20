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

function getCurrentUserId() {
  if (typeof window === 'undefined') return 'jonas';
  return localStorage.getItem('currentUserId') || 'jonas';
}

// Add request interceptor for auth if needed
api.interceptors.request.use((config) => {
  const currentUserId = getCurrentUserId();

  if (config.params) {
    config.params.userId = config.params.userId || currentUserId;
  } else {
    config.params = { userId: currentUserId };
  }

  if (config.data && typeof config.data === 'object' && !Array.isArray(config.data)) {
    config.data.userId = config.data.userId || currentUserId;
  }
  return config;
});

export default api;
