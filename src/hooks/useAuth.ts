import { useEffect } from 'react';
import { useAppStore } from '../store';
import supabase from '../services/supabase';

export function useAuth() {
  const { isAuthenticated, isLoading, user, activeDog } = useAppStore();
  return { isAuthenticated, isLoading, user, activeDog };
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAppStore();
  return { isAuthenticated, isLoading };
}
