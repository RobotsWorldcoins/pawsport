import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadow } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'flat' | 'elevated';
  padding?: number;
}

export default function Card({ children, style, variant = 'default', padding = Spacing.lg }: CardProps) {
  return (
    <View style={[
      styles.card,
      variant === 'elevated' && Shadow.lg,
      variant === 'default' && Shadow.md,
      { padding },
      style,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
