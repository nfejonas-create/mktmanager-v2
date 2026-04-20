import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextData {
  user: AppUser | null;
  users: AppUser[];
  token: string | null;
  currentUserId: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchUser: (userId: string) => void;
  isLoading: boolean;
}

const STORAGE_KEYS = {
  token: 'token',
  user: 'user',
  currentUserId: 'currentUserId'
};

const DEFAULT_USERS: AppUser[] = [
  { id: 'jonas', name: 'Jonas Breitenbach', email: 'nfe.jonas@gmail.com' },
  { id: 'niulane', name: 'Niulane Kleber', email: 'niulane@postflow.app' }
];

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

function getStoredUser(): AppUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistSession(token: string, user: AppUser) {
  if (typeof window === 'undefined') return;

  localStorage.setItem(STORAGE_KEYS.token, token);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  localStorage.setItem(STORAGE_KEYS.currentUserId, user.id);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const users = useMemo(() => DEFAULT_USERS, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    try {
      const storedToken = localStorage.getItem(STORAGE_KEYS.token);
      const storedCurrentUserId = localStorage.getItem(STORAGE_KEYS.currentUserId);
      const storedUser = getStoredUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setCurrentUserId(storedCurrentUserId || storedUser.id);
      }
    } catch (error) {
      console.error('Erro ao restaurar sessao:', error);
      localStorage.removeItem(STORAGE_KEYS.token);
      localStorage.removeItem(STORAGE_KEYS.user);
      localStorage.removeItem(STORAGE_KEYS.currentUserId);
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, _password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const matchedUser =
      users.find((candidate) => normalizedEmail.includes(candidate.id)) ||
      users.find((candidate) => candidate.email.toLowerCase() === normalizedEmail) ||
      users[0];

    const mockUser: AppUser = {
      ...matchedUser,
      email: normalizedEmail || matchedUser.email
    };

    const mockToken = `mock_token_${mockUser.id}_${Date.now()}`;

    persistSession(mockToken, mockUser);
    setToken(mockToken);
    setUser(mockUser);
    setCurrentUserId(mockUser.id);
  };

  const switchUser = (userId: string) => {
    const nextUser = users.find((candidate) => candidate.id === userId);
    if (!nextUser || !token) return;

    persistSession(token, nextUser);
    setUser(nextUser);
    setCurrentUserId(nextUser.id);
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.token);
      localStorage.removeItem(STORAGE_KEYS.user);
      localStorage.removeItem(STORAGE_KEYS.currentUserId);
    }
    setToken(null);
    setUser(null);
    setCurrentUserId(null);
  };

  return (
    <AuthContext.Provider value={{ user, users, token, currentUserId, login, logout, switchUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
