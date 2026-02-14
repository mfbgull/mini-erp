import { User } from '../types';

const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'miniERP-theme',
  SIDEBAR_COLLAPSED: 'sidebarCollapsed',
} as const;

export const storage = {
  getToken: (): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch {
      return null;
    }
  },
  
  setToken: (token: string): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } catch (error) {
      console.error('Failed to save token:', error);
    }
  },
  
  removeToken: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  },
  
  getUser: (): User | null => {
    try {
      const user = localStorage.getItem(STORAGE_KEYS.USER);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Failed to parse user:', error);
      return null;
    }
  },
  
  setUser: (user: User): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  },
  
  removeUser: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (error) {
      console.error('Failed to remove user:', error);
    }
  },
  
  clearAuth: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (error) {
      console.error('Failed to clear auth:', error);
    }
  },
  
  getTheme: (): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEYS.THEME);
    } catch {
      return null;
    }
  },
  
  setTheme: (theme: string): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  },
  
  getSidebarCollapsed: (): boolean => {
    try {
      return localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true';
    } catch {
      return false;
    }
  },
  
  setSidebarCollapsed: (collapsed: boolean): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(collapsed));
    } catch (error) {
      console.error('Failed to save sidebar state:', error);
    }
  },
};
