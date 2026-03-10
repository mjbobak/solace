import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { toast } from 'sonner';

import { authService } from '../services/authService';
import type { AuthState, LoginCredentials, User } from '../types/auth.types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

        if (storedToken) {
          const userData = await authService.getCurrentUser(storedToken);
          setToken(storedToken);
          setUser(userData);
        }
      } catch (error) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        console.error('Failed to validate stored token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadToken();
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<boolean> => {
      try {
        setIsLoading(true);

        const authToken = await authService.login(credentials);
        const userData = await authService.getCurrentUser(
          authToken.access_token,
        );

        localStorage.setItem(TOKEN_STORAGE_KEY, authToken.access_token);
        setToken(authToken.access_token);
        setUser(userData);

        toast.success(`Welcome back, ${userData.username}!`);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        toast.error(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    if (token) {
      authService.logout(token).catch(console.error);
    }

    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);

    toast.success('Logged out successfully');
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      isLoading,
      login,
      logout,
    }),
    [user, token, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};
