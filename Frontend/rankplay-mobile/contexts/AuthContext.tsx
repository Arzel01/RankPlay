/**
 * Authentication Context for RankPlay
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { User } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    display_name?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      await api.init();
      if (api.isAuthenticated()) {
        const userData = await api.getMe();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth init error:', error);
      await api.clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('[AuthContext] login called with email:', email);
    try {
      console.log('[AuthContext] Calling api.login...');
      const response = await api.login(email, password);
      console.log('[AuthContext] api.login response:', response);
      setUser(response.user);
      console.log('[AuthContext] User set successfully');
    } catch (error) {
      console.error('[AuthContext] login error:', error);
      throw error;
    }
  };

  const register = async (data: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    display_name?: string;
  }) => {
    console.log('[AuthContext] register called with username:', data.username);
    try {
      console.log('[AuthContext] Calling api.register...');
      const response = await api.register(data);
      console.log('[AuthContext] api.register response:', response);
      setUser(response.user);
      console.log('[AuthContext] User set successfully');
    } catch (error) {
      console.error('[AuthContext] register error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    if (api.isAuthenticated()) {
      const userData = await api.getMe();
      setUser(userData);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
