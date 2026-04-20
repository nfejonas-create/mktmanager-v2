import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import api, { clearImpersonateUserId, setImpersonateUserId } from '../services/api';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextData {
  user: AppUser | null;
  effectiveUser: AppUser | null;
  users: AppUser[];
  isAdminMode: boolean;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  impersonateUser: (userId: string) => Promise<void>;
  stopImpersonating: () => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const STORAGE_KEYS = {
  token: 'auth.token',
  user: 'auth.user',
  effectiveUser: 'auth.effectiveUser',
  users: 'auth.users'
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

function readStored<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
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
  localStorage.removeItem(STORAGE_KEYS.effectiveUser);
  localStorage.removeItem(STORAGE_KEYS.users);
  clearImpersonateUserId();
}

export function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.token);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [effectiveUser, setEffectiveUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdminMode = !!effectiveUser && !!user && effectiveUser.id !== user.id;

  useEffect(() => {
    const storedToken = getStoredToken();
    const storedUser = readStored<AppUser>(STORAGE_KEYS.user);
    const storedEffectiveUser = readStored<AppUser>(STORAGE_KEYS.effectiveUser);
    const storedUsers = readStored<AppUser[]>(STORAGE_KEYS.users);

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
      setEffectiveUser(storedEffectiveUser || storedUser);
      setUsers(storedUsers || []);
    } else {
      clearAuthStorage();
    }

    setIsLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser, users: allUsers } = response.data;

    persistSession(newToken, newUser);
    localStorage.setItem(STORAGE_KEYS.effectiveUser, JSON.stringify(newUser));
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(allUsers || []));

    setToken(newToken);
    setUser(newUser);
    setEffectiveUser(newUser);
    setUsers(allUsers || []);
  }

  function logout() {
    clearAuthStorage();
    setToken(null);
    setUser(null);
    setEffectiveUser(null);
    setUsers([]);
  }

  async function impersonateUser(userId: string) {
    const response = await api.post('/auth/impersonate', { targetUserId: userId });
    const targetUser: AppUser = response.data.targetUser;

    setImpersonateUserId(userId);
    setEffectiveUser(targetUser);
    localStorage.setItem(STORAGE_KEYS.effectiveUser, JSON.stringify(targetUser));

    // Recarregar para todos os dados do dashboard atualizarem
    window.location.reload();
  }

  async function stopImpersonating() {
    await api.post('/auth/stop-impersonating');
    clearImpersonateUserId();
    setEffectiveUser(user);
    localStorage.setItem(STORAGE_KEYS.effectiveUser, JSON.stringify(user));

    window.location.reload();
  }

  async function refreshUsers() {
    if (user?.role !== 'ADMIN') return;
    try {
      const response = await api.get('/admin/users');
      const updatedUsers = response.data.users;
      setUsers(updatedUsers);
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(updatedUsers));
    } catch (e) {
      console.error('Failed to refresh users', e);
    }
  }

  const value = useMemo<AuthContextData>(() => ({
    user,
    effectiveUser,
    users,
    isAdminMode,
    token,
    isLoading,
    login,
    logout,
    impersonateUser,
    stopImpersonating,
    refreshUsers
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, effectiveUser, users, isAdminMode, token, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
