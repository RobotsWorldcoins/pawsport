import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../theme';

const RARITY_COLORS: Record<string, [string, string]> = {
  common: [Colors.textMuted, Colors.border],
  rare: [Colors.accentBlue, Colors.accent],
  epic: [Colors.tierChampion, Colors.tierElite],
  legendary: [Colors.gold, Colors.tierMythic],
};

export default function BadgeDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { badge, earnedAt } = route.params;
  const colors = RARITY_COLORS[badge.rarity] || RARITY_COLORS.common;

  return (
    <LinearGradient colors={[colors[0] + '22', '#FFF', '#FFF']} style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.content}>
        <LinearGradient colors={colors} style={styles.iconWrap}>
          <Text style={styles.icon}>{badge.icon}</Text>
        </LinearGradient>
        <View style={[styles.rarityChip, { backgroundColor: colors[0] + '20' }]}>
          <Text style={[styles.rarityText, { color: colors[0] }]}>{badge.rarity?.toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{badge.name}</Text>
        <Text style={styles.desc}>{badge.description}</Text>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Category</Text>
            <Text style={styles.metaValue}>{badge.category}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>XP Reward</Text>
            <Text style={[styles.metaValue, { color: Colors.primary }]}>+{badge.xp_reward} XP</Text>
          </View>
          {earnedAt && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Earned</Text>
              <Text style={styles.metaValue}>{new Date(earnedAt).toLocaleDateString()}</Text>
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { padding: Spacing.xl, paddingTop: Spacing.huge },
  backText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.medium },
  content: { flex: 1, alignItems: 'center', padding: Spacing.xxl, gap: Spacing.xl },
  iconWrap: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 60 },
  rarityChip: { paddingHorizontal: Spacing.lg, paddingVertical: 6, borderRadius: BorderRadius.full },
  rarityText: { fontSize: FontSize.xs, fontWeight: FontWeight.black, letterSpacing: 1 },
  name: { fontSize: FontSize.xxxl, fontWeight: FontWeight.black, color: Colors.text, textAlign: 'center' },
  desc: { fontSize: FontSize.lg, color: Colors.textSecondary, textAlign: 'center', lineHeight: 26 },
  meta: { flexDirection: 'row', gap: Spacing.xxxl, marginTop: Spacing.lg },
  metaItem: { alignItems: 'center', gap: 4 },
  metaLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  metaValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
});
