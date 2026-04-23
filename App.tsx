import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import { authService } from './src/services/auth';
import supabase from './src/services/supabase';
import { useAppStore } from './src/store';
import AppNavigator from './src/navigation';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

export default function App() {
  const { setUser, setActiveDog, setAuthenticated, setLoading, setSubscriptionTier } = useAppStore();

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile) {
            setUser(profile as any);
            setSubscriptionTier(profile.subscription_tier || 'free');
          }

          const { data: dogs } = await supabase
            .from('dogs')
            .select('*')
            .eq('owner_id', session.user.id)
            .order('created_at', { ascending: true })
            .limit(1);

          if (dogs && dogs.length > 0) setActiveDog(dogs[0]);
          setAuthenticated(true);
        } catch (e) {
          console.error('Session restore error:', e);
        }
      } else {
        setAuthenticated(false);
        setUser(null);
        setActiveDog(null);
      }
      setLoading(false);
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} urlScheme="pawsport">
          <StatusBar style="dark" />
          <AppNavigator />
        </StripeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
