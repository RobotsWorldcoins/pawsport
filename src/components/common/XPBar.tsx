import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '../../theme';

interface XPBarProps {
  current: number;
  needed: number;
  percentage: number;
  level: number;
  compact?: boolean;
}

export default function XPBar({ current, needed, percentage, level, compact }: XPBarProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: percentage,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const barWidth = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactBar}>
          <Animated.View style={[styles.compactFill, { width: barWidth }]} />
        </View>
        <Text style={styles.compactText}>{current}/{needed} XP</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.levelLabel}>Lv. {level}</Text>
        <Text style={styles.xpText}>{current} / {needed} XP</Text>
      </View>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width: barWidth }]}>
          <View style={styles.barShine} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  levelLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  xpText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  barTrack: {
    height: 10,
    backgroundColor: Colors.xpBackground,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.xpBar,
    borderRadius: BorderRadius.full,
  },
  barShine: {
    position: 'absolute',
    top: 1, left: 4,
    width: 20, height: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: BorderRadius.full,
  },
  compactContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  compactBar: {
    flex: 1, height: 6,
    backgroundColor: Colors.xpBackground,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  compactFill: { height: '100%', backgroundColor: Colors.xpBar, borderRadius: BorderRadius.full },
  compactText: { fontSize: FontSize.xs, color: Colors.textSecondary, minWidth: 70 },
});
