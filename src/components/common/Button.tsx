import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator,
  ViewStyle, TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing, Shadow } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'premium' | 'pro';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export default function Button({
  title, onPress, variant = 'primary', size = 'md',
  loading, disabled, style, textStyle, icon,
}: ButtonProps) {
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const sizeStyles = {
    sm: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
    md: { paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md + 2, borderRadius: BorderRadius.lg },
    lg: { paddingHorizontal: Spacing.xxxl, paddingVertical: Spacing.lg, borderRadius: BorderRadius.xl },
  };

  const textSizes = { sm: FontSize.sm, md: FontSize.md, lg: FontSize.lg };

  if (variant === 'premium') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        style={[styles.base, sizeStyles[size], style]}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[Colors.silver, Colors.silverDark, Colors.silver]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.gradient, sizeStyles[size]]}
        >
          {icon}
          <Text style={[styles.text, { fontSize: textSizes[size] }, textStyle]}>
            {loading ? '' : title}
          </Text>
          {loading && <ActivityIndicator color="#fff" size="small" />}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'pro') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        style={[styles.base, sizeStyles[size], style]}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[Colors.gold, Colors.goldDark, Colors.gold]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.gradient, sizeStyles[size]]}
        >
          {icon}
          <Text style={[styles.text, { fontSize: textSizes[size], color: '#1A1A2E' }, textStyle]}>
            {loading ? '' : title}
          </Text>
          {loading && <ActivityIndicator color="#1A1A2E" size="small" />}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyles: Record<string, { bg: string; textColor: string; border?: string }> = {
    primary: { bg: Colors.primary, textColor: Colors.textInverse },
    secondary: { bg: Colors.secondary, textColor: Colors.text },
    ghost: { bg: 'transparent', textColor: Colors.primary, border: Colors.primary },
    danger: { bg: Colors.error, textColor: Colors.textInverse },
  };

  const vs = variantStyles[variant];

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.base,
        sizeStyles[size],
        { backgroundColor: vs.bg, borderColor: vs.border, borderWidth: vs.border ? 1.5 : 0 },
        (disabled || loading) && styles.disabled,
        variant === 'primary' && Shadow.colored(Colors.primary),
        style,
      ]}
      activeOpacity={0.85}
    >
      {icon}
      {loading ? (
        <ActivityIndicator color={vs.textColor} size="small" />
      ) : (
        <Text style={[styles.text, { fontSize: textSizes[size], color: vs.textColor }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  text: {
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.5,
  },
});
