import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Só executa no cliente
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }
    
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Erro ao restaurar sessao:', error);
      // Limpa dados corrompidos
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (e) {
        // Ignora erro de localStorage
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, _password: string) => {
    // Mock login para desenvolvimento
    const mockUser: User = {
      id: '1',
      name: 'Jonas Breitenbach',
      email: email,
      avatar: undefined
    };
    
    const mockToken = 'mock_token_' + Date.now();
    
    // Só acessa localStorage no cliente
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
      } catch (e) {
        console.error('Erro ao salvar no localStorage:', e);
      }
    }
    
    setToken(mockToken);
    setUser(mockUser);
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (e) {
        console.error('Erro ao limpar localStorage:', e);
      }
    }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
