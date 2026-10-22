import { create } from 'zustand';
import api from '@/lib/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('nexchat_token') : null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  authChecked: false,
  authError: null,

  checkAuth: async () => {
    // If in browser and no token is stored, user is not logged in.
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('nexchat_token');
      if (!storedToken) {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          authChecked: true,
          authError: null,
        });
        return null;
      }
    }

    set({ isLoading: true, error: null });
    try {
      const data = await api.get('/auth/me');
      const user = data.user || data;
      set({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        authChecked: true,
        authError: null,
      });
      return user;
    } catch (err) {
      if (err.status === 401) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('nexchat_token');
          } catch {
            // ignore
          }
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          authChecked: true,
          authError: null,
        });
        return null;
      }

      const isConnectionIssue = err?.isNetworkError || err?.isOffline || err?.isDatabaseDown;
      set((state) => ({
        user: isConnectionIssue ? state.user : null,
        isAuthenticated: isConnectionIssue ? state.isAuthenticated : false,
        isLoading: false,
        authChecked: true,
        authError: isConnectionIssue ? err.message : null,
      }));
      return null;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.post('/auth/login', {
        email,
        identifier: email,
        password,
      });
      const user = data.user || data;
      const token = data.token;

      if (token && typeof window !== 'undefined') {
        try {
          localStorage.setItem('nexchat_token', token);
        } catch {
          // ignore
        }
      }

      set({ user, token: token || null, isAuthenticated: true, isLoading: false, authChecked: true });
      return { success: true, user, token };
    } catch (err) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  register: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.post('/auth/register', formData);
      const user = data.user || data;
      const token = data.token;

      if (token && typeof window !== 'undefined') {
        try {
          localStorage.setItem('nexchat_token', token);
        } catch {
          // ignore
        }
      }

      set({ user, token: token || null, isAuthenticated: true, isLoading: false, authChecked: true });
      return { success: true, user, token };
    } catch (err) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // Continue cleanup on failure
    } finally {
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('nexchat_token');
        } catch {
          // ignore
        }
      }
      set({ user: null, token: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return res;
    } catch (err) {
      throw err;
    }
  },

  forgotPassword: async (email) => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      return res;
    } catch (err) {
      throw err;
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await api.patch('/users/me', data);
      const updatedUser = res.user || res;
      set((state) => ({
        user: { ...state.user, ...updatedUser },
      }));
      return updatedUser;
    } catch (err) {
      throw err;
    }
  },

  updateAvatar: async (formData) => {
    try {
      const res = await api.patch('/users/me/avatar', formData);
      const updatedUser = res.user || res;
      set((state) => ({
        user: { ...state.user, ...updatedUser },
      }));
      return updatedUser;
    } catch (err) {
      throw err;
    }
  },

  updatePrivacy: async (privacyData) => {
    try {
      const res = await api.patch('/users/me/privacy', privacyData);
      const updatedUser = res.user || res;
      set((state) => ({
        user: { ...state.user, ...updatedUser },
      }));
      return updatedUser;
    } catch (err) {
      throw err;
    }
  },
}));

export default useAuthStore;
