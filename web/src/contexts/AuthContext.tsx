import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import api from '../services/api';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextData {
  user: AppUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const STORAGE_KEYS = {
  token: 'auth.token',
  user: 'auth.user'
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

function readStoredUser(): AppUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    return raw ? JSON.parse(raw) as AppUser : null;
  } catch {
    return null;
  }
}

function persistSession(token: string, user: AppUser) {
  localStorage.setItem(STORAGE_KEYS.token, token);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

export function clearAuthStorage() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
}

export function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.token);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = getStoredToken();
    const storedUser = readStoredUser();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    } else {
      clearAuthStorage();
    }

    setIsLoading(false);
  }, []);

  async function applySession(nextToken: string, nextUser: AppUser) {
    persistSession(nextToken, nextUser);
    setToken(nextToken);
    setUser(nextUser);
  }

  async function login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    await applySession(response.data.token, response.data.user);
  }

  async function register(name: string, email: string, password: string) {
    const response = await api.post('/auth/register', { name, email, password });
    await applySession(response.data.token, response.data.user);
  }

  function logout() {
    clearAuthStorage();
    setToken(null);
    setUser(null);
  }

  const value = useMemo<AuthContextData>(() => ({
    user,
    token,
    login,
    register,
    logout,
    isLoading
  }), [user, token, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
