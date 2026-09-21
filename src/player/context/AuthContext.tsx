import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../utils/api';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function PlayerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.getMe().then(setUser).catch(() => localStorage.removeItem('token'));
    }
  }, []);

  const login = async (username: string, password: string) => {
    const data = await api.login({ username, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isSuperAdmin: user?.role === 'super_admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const usePlayerAuth = () => useContext(AuthContext);
