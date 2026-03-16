import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  useMemo,
  ReactNode 
} from 'react';
import toast from 'react-hot-toast';

import { User } from '../types';
import api from '../utils/api';
import { handleError } from '../utils/errors';
import { storage } from '../utils/storage';

interface LoginResponse {
  user: User;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = storage.getUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const userData = response.data?.data?.user;

      if (!userData) {
        throw new Error('Invalid response from server');
      }

      // Token is now handled via httpOnly cookie automatically
      storage.setUser(userData);
      setUser(userData);

      toast.success(`Welcome back, ${userData.full_name}!`);
      return { success: true };
    } catch (error: unknown) {
      const appError = handleError(error, 'AuthContext.login', { showToast: false });
      toast.error(appError.message);
      return { success: false, error: appError.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      handleError(error, 'AuthContext.logout', { showToast: false });
    } finally {
      // Only clear user data, token cookie is cleared by server
      storage.removeUser();
      setUser(null);
      toast.success('Logged out successfully');
    }
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  }), [user, loading, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
