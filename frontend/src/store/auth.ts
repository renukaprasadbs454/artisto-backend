import { create } from 'zustand';

export interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  skills: string[];
}

export interface User {
  id: string;
  email: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  emailVerified: boolean;
  profile: UserProfile | null;
  suspended: boolean;
  createdAt: string;
  profileComplete?: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  logout: () => set({ user: null, accessToken: null }),
}));
