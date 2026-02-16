import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  useMemo,
  ReactNode 
} from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { storage } from '../utils/storage';
import { User } from '../types';

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
      const response = await api.post<LoginResponse>('/auth/login', { username, password });
      const { user: userData } = response.data;

      // Token is now handled via httpOnly cookie automatically
      storage.setUser(userData);
      setUser(userData);

      toast.success(`Welcome back, ${userData.full_name}!`);
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
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
