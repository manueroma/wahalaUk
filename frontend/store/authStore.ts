import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  _id: string;
  email: string;
  name: string;
  age: number;
  gender: string;
  location_city: string;
  location_country: string;
  bio: string;
  interests: string[];
  photos: string[];
  premium_status: string;
  roses_received: number;
  profile_complete: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),

  login: async (user, token) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ user, token });
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    set({ user: null, token: null });
  },

  loadAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ user, token, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Load auth error:', error);
      set({ isLoading: false });
    }
  },

  updateUser: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null
  })),

  deleteAccount: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
      const response = await fetch(`${API_URL}/api/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Clear all local data
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        set({ user: null, token: null });
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Failed to delete account' };
      }
    } catch (error) {
      console.error('Delete account error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  },
}));