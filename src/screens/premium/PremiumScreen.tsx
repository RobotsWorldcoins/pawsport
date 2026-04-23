import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStripe } from '@stripe/stripe-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import supabase from '../../services/supabase';
import { useAppStore } from '../../store';
import Button from '../../components/common/Button';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';

const PLANS = [
  {
    id: 'premium',
    name: 'Premium',
    price: '€9.99',
    period: '/month',
    color: Colors.silver,
    gradientColors: [Colors.silver, Colors.silverDark] as [string, string],
    textColor: '#1A1A2E',
    badge: '◈ PREMIUM',
    features: [
      '🥈 Silver profile frame',
      '2× XP multiplier on all activities',
      '🗺️ Advanced map filters',
      '🎯 Premium missions',
      '📊 10 stat points/month',
      '📋 Enhanced dog passport',
      '📤 Basic export (share cards)',
    ],
  },
  {
    id: 'premium_pro',
    name: 'Premium Pro',
    price: '€19.99',
    period: '/month',
    color: Colors.gold,
    gradientColors: [Colors.gold, Colors.goldDark] as [string, string],
    textColor: '#1A1A2E',
    badge: '✦ PRO',
    features: [
      '🥇 Gold profile frame',
      '3× XP multiplier on all activities',
      '🗺️ All premium filters',
      '🎯 All missions (premium + exclusive)',
      '📊 20 stat points/month',
      '⚔️ Priority arena access',
      '📄 PDF Dog Passport export',
      '📈 Advanced analytics dashboard',
      '🌟 Profile highlight in social feed',
      '🎨 Exclusive cosmetics & frames',
    ],
    recommended: true,
  },
];

export default function PremiumScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { user, subscriptionTier, setSubscriptionTier } = useAppStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from('subscriptions')
        .select('tier,status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      if (data) setCurrentPlan(data.tier);
    })();
  }, [user]);

  const handleSubscribe = async (planId: string) => {
    if (!user) return;
    setLoading(planId);
    try {
      // Call our Edge Function to create PaymentIntent / SetupIntent
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { planId, userId: user.id, email: user.email },
      });

      if (error || !data) throw new Error(error?.message || 'Failed to create subscription');

      const { paymentIntentClientSecret, ephemeralKey, customer } = data;

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Pawsport',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret,
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: { email: user.email },
        returnURL: 'pawsport://payment-return',
      });

      if (initError) throw new Error(initError.message);

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code !== 'Canceled') {
          throw new Error(presentError.message);
        }
        return;
      }

      // Payment successful — subscription activated via webhook
      setSubscriptionTier(planId as any);
      Alert.alert(
        '🎉 Welcome to ' + (planId === 'premium_pro' ? 'Premium Pro' : 'Premium') + '!',
        'Your subscription is now active. Enjoy all the benefits!',
        [{ text: 'Let\'s go! 🐾', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      if (e.message !== 'Canceled') {
        Alert.alert('Payment Error', e.message);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel? You\'ll keep access until the end of your billing period.',
      [
        { text: 'Keep Premium', style: 'cancel' },
        {
          text: 'Cancel', style: 'destructive',
          onPress: async () => {
            if (!user) return;
            const { error } = await supabase.functions.invoke('cancel-subscription', {
              body: { userId: user.id },
            });
            if (!error) {
              setCurrentPlan(null);
              setSubscriptionTier('free');
              Alert.alert('Cancelled', 'Your subscription has been cancelled.');
            }
          }
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: 60 }]}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>✨ Upgrade Pawsport</Text>
        <Text style={styles.subtitle}>Supercharge your dog's journey with premium features</Text>
      </View>

      {/* Free tier comparison */}
      <View style={styles.freeCard}>
        <Text style={styles.freeTier}>FREE</Text>
        <Text style={styles.freeFeatures}>Map · Dog Profile · Basic Social · Competitions · Arena (Lv.20+)</Text>
      </View>

      {/* Premium Plans */}
      {PLANS.map((plan) => {
        const isActive = currentPlan === plan.id || subscriptionTier === plan.id;
        return (
          <View key={plan.id} style={[styles.planCard, plan.recommended && styles.planCardRecommended]}>
            {plan.recommended && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>BEST VALUE</Text>
              </View>
            )}
            <LinearGradient
              colors={plan.gradientColors}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.planHeader}
            >
              <View>
                <Text style={[styles.planBadge, { color: plan.textColor }]}>{plan.badge}</Text>
                <Text style={[styles.planName, { color: plan.textColor }]}>{plan.name}</Text>
              </View>
              <View style={styles.planPriceWrap}>
                <Text style={[styles.planPrice, { color: plan.textColor }]}>{plan.price}</Text>
                <Text style={[styles.planPeriod, { color: plan.textColor + 'CC' }]}>{plan.period}</Text>
              </View>
            </LinearGradient>

            <View style={styles.planFeatures}>
              {plan.features.map((f) => (
                <Text key={f} style={styles.planFeature}>{f}</Text>
              ))}
            </View>

            {isActive ? (
              <View>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>✓ Your Current Plan</Text>
                </View>
                <Button
                  title="Cancel Subscription"
                  onPress={handleCancel}
                  variant="ghost"
                  size="sm"
                  style={styles.cancelBtn}
                />
              </View>
            ) : (
              <Button
                title={`Subscribe to ${plan.name}`}
                onPress={() => handleSubscribe(plan.id)}
                loading={loading === plan.id}
                variant={plan.id === 'premium_pro' ? 'pro' : 'premium'}
                size="lg"
              />
            )}
          </View>
        );
      })}

      <Text style={styles.legal}>
        Subscriptions auto-renew monthly. Cancel anytime. Prices include VAT where applicable.
        Payments processed securely via Stripe.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, gap: Spacing.xl },
  backBtn: { marginBottom: -Spacing.sm },
  backText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.medium },
  header: { alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.black, color: Colors.text, textAlign: 'center' },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  freeCard: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  freeTier: { fontSize: FontSize.xs, fontWeight: FontWeight.black, color: Colors.textMuted, letterSpacing: 2 },
  freeFeatures: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  planCard: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 0,
    ...Shadow.md,
  },
  planCardRecommended: { borderColor: Colors.gold, ...Shadow.colored(Colors.gold) },
  recommendedBadge: {
    backgroundColor: Colors.gold,
    paddingVertical: 6,
    alignItems: 'center',
  },
  recommendedText: { fontSize: FontSize.xs, fontWeight: FontWeight.black, color: '#1A1A2E', letterSpacing: 1 },
  planHeader: {
    padding: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planBadge: { fontSize: FontSize.xs, fontWeight: FontWeight.black, letterSpacing: 1 },
  planName: { fontSize: FontSize.xxl, fontWeight: FontWeight.black },
  planPriceWrap: { alignItems: 'flex-end' },
  planPrice: { fontSize: FontSize.xxxl, fontWeight: FontWeight.black },
  planPeriod: { fontSize: FontSize.sm },
  planFeatures: { padding: Spacing.xl, gap: Spacing.sm, backgroundColor: Colors.surface },
  planFeature: { fontSize: FontSize.md, color: Colors.text, lineHeight: 24 },
  activeBadge: {
    marginHorizontal: Spacing.xl, marginBottom: Spacing.sm,
    padding: Spacing.md, borderRadius: BorderRadius.lg,
    backgroundColor: `${Colors.success}15`, alignItems: 'center',
  },
  activeBadgeText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.success },
  cancelBtn: { marginHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  legal: {
    fontSize: FontSize.xs, color: Colors.textMuted,
    textAlign: 'center', lineHeight: 18,
  },
});
