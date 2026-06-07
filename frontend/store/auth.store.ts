import { create } from 'zustand';
import { User } from '@/types';
import { setAccessToken } from '@/lib/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  login: (token, user) => {
    setAccessToken(token);
    set({ user, isLoading: false });
  },
  logout: () => {
    setAccessToken(null);
    set({ user: null, isLoading: false });
  },
  setLoading: (isLoading) => set({ isLoading }),
}));
