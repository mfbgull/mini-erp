import { User } from '../types';

const STORAGE_KEYS = {
  // Token is stored in httpOnly cookie by the server - client MUST NOT store tokens
  USER: 'miniERP-user',
  THEME: 'miniERP-theme',
  SIDEBAR_COLLAPSED: 'miniERP-sidebarCollapsed',
} as const;

export const storage = {
  getUser: (): User | null => {
    try {
      const user = localStorage.getItem(STORAGE_KEYS.USER);
      if (!user || user === 'undefined' || user === 'null') {
        return null;
      }
      return JSON.parse(user);
    } catch {
      localStorage.removeItem(STORAGE_KEYS.USER);
      return null;
    }
  },

  setUser: (user: User): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch {
      // Silent fail - don't expose internal errors
    }
  },

  removeUser: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch {
      // Silent fail
    }
  },

  clearAuth: (): void => {
    try {
      // Only clear user - token is cleared server-side via cookie
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch {
      // Silent fail
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
    } catch {
      // Silent fail
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
    } catch {
      // Silent fail
    }
  },
};
