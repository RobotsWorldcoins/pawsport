import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '../../theme';
import type { SubscriptionTier } from '../../types';

interface PremiumBadgeProps {
  tier: SubscriptionTier;
  size?: 'sm' | 'md';
}

export default function PremiumBadge({ tier, size = 'md' }: PremiumBadgeProps) {
  if (tier === 'free') return null;

  const isPro = tier === 'premium_pro';
  const colors: [string, string] = isPro
    ? [Colors.gold, Colors.goldDark]
    : [Colors.silver, Colors.silverDark];
  const label = isPro ? '✦ PRO' : '◈ PREMIUM';
  const textColor = isPro ? '#1A1A2E' : '#fff';

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.badge, size === 'sm' && styles.badgeSm]}
    >
      <Text style={[styles.text, { color: textColor }, size === 'sm' && styles.textSm]}>
        {label}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  badgeSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.black,
    letterSpacing: 0.5,
  },
  textSm: { fontSize: 9 },
});
