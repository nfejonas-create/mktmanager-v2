import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface CreateUserInput {
  name: string;
  email: string;
}

interface AuthContextData {
  user: AppUser | null;
  users: AppUser[];
  token: string | null;
  currentUserId: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchUser: (userId: string) => void;
  addUser: (input: CreateUserInput) => { success: boolean; message?: string };
  isLoading: boolean;
}

const STORAGE_KEYS = {
  token: 'token',
  user: 'user',
  currentUserId: 'currentUserId',
  users: 'appUsers'
};

const DEFAULT_USERS: AppUser[] = [
  { id: 'jonas', name: 'Jonas Breitenbach', email: 'nfe.jonas@gmail.com' },
  { id: 'niulane', name: 'Niulane Kleber', email: 'niulane@postflow.app' }
];

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getStoredUsers(): AppUser[] {
  if (typeof window === 'undefined') return DEFAULT_USERS;

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.users);
    if (!raw) return DEFAULT_USERS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

function getStoredUser(): AppUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistUsers(users: AppUser[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function persistSession(token: string, user: AppUser) {
  if (typeof window === 'undefined') return;

  localStorage.setItem(STORAGE_KEYS.token, token);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  localStorage.setItem(STORAGE_KEYS.currentUserId, user.id);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>(DEFAULT_USERS);
  const [token, setToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    try {
      const storedUsers = getStoredUsers();
      const storedToken = localStorage.getItem(STORAGE_KEYS.token);
      const storedCurrentUserId = localStorage.getItem(STORAGE_KEYS.currentUserId);
      const storedUser = getStoredUser();

      setUsers(storedUsers);

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
      localStorage.removeItem(STORAGE_KEYS.users);
      setUsers(DEFAULT_USERS);
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

  const addUser = (input: CreateUserInput) => {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();

    if (!name || !email) {
      return { success: false, message: 'Nome e email são obrigatórios.' };
    }

    if (users.some((candidate) => candidate.email.toLowerCase() === email)) {
      return { success: false, message: 'Já existe um usuário com esse email.' };
    }

    const baseId = slugify(name) || `user-${Date.now()}`;
    let nextId = baseId;
    let counter = 2;

    while (users.some((candidate) => candidate.id === nextId)) {
      nextId = `${baseId}-${counter++}`;
    }

    const nextUser: AppUser = { id: nextId, name, email };
    const nextUsers = [...users, nextUser];

    setUsers(nextUsers);
    persistUsers(nextUsers);

    return { success: true };
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
    <AuthContext.Provider value={{ user, users, token, currentUserId, login, logout, switchUser, addUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
