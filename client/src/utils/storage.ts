import { User } from '../types';

export const storage = {
  getUser: (): User | null => {
    try {
      const user = localStorage.getItem('miniERP-user');
      if (!user || user === 'undefined' || user === 'null') {
        return null;
      }
      return JSON.parse(user);
    } catch {
      localStorage.removeItem('miniERP-user');
      return null;
    }
  },

  setUser: (user: User): void => {
    try {
      localStorage.setItem('miniERP-user', JSON.stringify(user));
    } catch {
      // Silent fail - don't expose internal errors
    }
  },

  removeUser: (): void => {
    try {
      localStorage.removeItem('miniERP-user');
    } catch {
      // Silent fail
    }
  },
};
