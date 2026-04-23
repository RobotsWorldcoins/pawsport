import { create } from 'zustand';
import type { User, Dog, DogStats, SubscriptionTier } from '../types';

interface AppState {
  user: User | null;
  activeDog: Dog | null;
  dogStats: DogStats | null;
  subscriptionTier: SubscriptionTier;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  setActiveDog: (dog: Dog | null) => void;
  setDogStats: (stats: DogStats | null) => void;
  setSubscriptionTier: (tier: SubscriptionTier) => void;
  setLoading: (loading: boolean) => void;
  setAuthenticated: (auth: boolean) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  activeDog: null,
  dogStats: null,
  subscriptionTier: 'free',
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user }),
  setActiveDog: (activeDog) => set({ activeDog }),
  setDogStats: (dogStats) => set({ dogStats }),
  setSubscriptionTier: (subscriptionTier) => set({ subscriptionTier }),
  setLoading: (isLoading) => set({ isLoading }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  reset: () => set({
    user: null,
    activeDog: null,
    dogStats: null,
    subscriptionTier: 'free',
    isLoading: false,
    isAuthenticated: false,
  }),
}));
