import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { clearAuthStorage, getStoredToken } from '../contexts/AuthContext';

const fallbackApiUrl = 'https://postflow-backend-cspj.onrender.com/api';
const viteApiUrl = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_URL;

export const STORAGE_KEYS = {
  impersonateUserId: 'auth.impersonateUserId'
};

export function getImpersonateUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.impersonateUserId);
}

export function setImpersonateUserId(id: string) {
  localStorage.setItem(STORAGE_KEYS.impersonateUserId, id);
}

export function clearImpersonateUserId() {
  localStorage.removeItem(STORAGE_KEYS.impersonateUserId);
}

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

  // Adicionar header de impersonação quando estiver gerenciando outro usuário
  const impersonateUserId = getImpersonateUserId();
  if (impersonateUserId) {
    config.headers['X-Impersonate-User-Id'] = impersonateUserId;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthStorage();
      clearImpersonateUserId();
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
