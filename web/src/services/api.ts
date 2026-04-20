import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { clearAuthStorage, getStoredToken } from '../contexts/AuthContext';

const fallbackApiUrl = 'https://postflow-backend-cspj.onrender.com/api';
const viteApiUrl = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_URL;

interface ApiClient extends AxiosInstance {
  upload<T = unknown>(url: string, formData: FormData, config?: AxiosRequestConfig<FormData>): Promise<AxiosResponse<T>>;
}

const api = axios.create({
  baseURL: viteApiUrl || fallbackApiUrl,
  timeout: 15000
}) as ApiClient;

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthStorage();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

api.upload = function upload(url, formData, config) {
  return api.post(url, formData, {
    ...config,
    headers: {
      ...(config?.headers || {}),
      'Content-Type': 'multipart/form-data'
    }
  });
};

export default api;
