import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import supabase from '../../services/supabase';
import { awardXP } from '../../services/xp';
import { useAppStore } from '../../store';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';
import type { ArenaResult, Dog, DogStats } from '../../types';

type ArenaType = 'agility' | 'sprint' | 'show';

const ARENA_CONFIG = {
  agility: {
    name: 'Agility Arena',
    icon: '⚡',
    desc: 'Speed, instinct and precision. Navigate the course faster than anyone!',
    color: Colors.tierTracker,
    gradient: [Colors.tierTracker + 'DD', Colors.tierChallenger + 'AA'] as [string, string],
    stats: ['agility', 'speed', 'instinct', 'focus'],
    unlockLevel: 20,
  },
  sprint: {
    name: 'Sprint Arena',
    icon: '💨',
    desc: 'Pure speed and raw power. Who is the fastest dog in Portugal?',
    color: Colors.accentBlue,
    gradient: [Colors.accentBlue + 'DD', Colors.accent + 'AA'] as [string, string],
    stats: ['speed', 'power', 'focus'],
    unlockLevel: 20,
  },
  show: {
    name: 'Show Arena',
    icon: '🌟',
    desc: 'Charm the crowd and earn votes. Style, personality, presence!',
    color: Colors.tierLegend,
    gradient: [Colors.tierLegend + 'DD', Colors.tierMythic + 'AA'] as [string, string],
    stats: ['charm'],
    unlockLevel: 20,
  },
};

export default function ArenaScreen() {
  const insets = useSafeAreaInsets();
  const { activeDog, subscriptionTier, dogStats } = useAppStore();
  const [selectedArena, setSelectedArena] = useState<ArenaType | null>(null);
  const [leaderboard, setLeaderboard] = useState<(ArenaResult & { dog: Dog })[]>([]);
  const [myResult, setMyResult] = useState<ArenaResult | null>(null);
  const [loading, setLoading] = useState(false);

  const isUnlocked = (activeDog?.level || 0) >= 20;
  const season = new Date().toISOString().slice(0, 7);

  const loadLeaderboard = async (arenaType: ArenaType) => {
    try {
      const { data, error } = await supabase
        .from('arena_results')
        .select('*, dog:dogs(*)')
        .eq('arena_type', arenaType)
        .eq('season', season)
        .order('score', { ascending: false })
        .limit(10);
      if (error) throw error;
      setLeaderboard((data as any) ?? []);
    } catch (e) {
      console.warn('Arena leaderboard load error:', e);
      setLeaderboard([]);
    }

    if (activeDog) {
      try {
        const { data: my } = await supabase
          .from('arena_results')
          .select('*')
          .eq('arena_type', arenaType)
          .eq('dog_id', activeDog.id)
          .eq('season', season)
          .maybeSingle();
        setMyResult(my ?? null);
      } catch (e) {
        console.warn('Arena my result load error:', e);
        setMyResult(null);
      }
    }
  };

  useEffect(() => {
    if (selectedArena) loadLeaderboard(selectedArena);
  }, [selectedArena]);

  const computeScore = (arena: ArenaType, stats: DogStats): number => {
    const config = ARENA_CONFIG[arena];
    const base = config.stats.reduce((sum, s) => sum + ((stats as any)[s] || 50), 0);
    const avg = base / config.stats.length;
    // Add randomness (10% variance for fairness)
    const variance = avg * 0.1 * (Math.random() * 2 - 1);
    return Math.round(avg + variance);
  };

  const handleEnterArena = async (arena: ArenaType) => {
    if (!activeDog || !dogStats) return;
    if (!isUnlocked) {
      Alert.alert('Locked 🔒', `Arena unlocks at Level 20!\nYou are Level ${activeDog.level}.`);
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);

    try {
      const score = computeScore(arena, dogStats);

      // Upsert result for this season
      const { error } = await supabase
        .from('arena_results')
        .upsert(
          { arena_type: arena, dog_id: activeDog.id, score, season },
          { onConflict: 'arena_type,dog_id,season' }
        );
      if (error) throw error;

      await awardXP(activeDog.id, 'event', undefined, subscriptionTier, activeDog.streak_days);

      await loadLeaderboard(arena);

      Alert.alert(
        `${ARENA_CONFIG[arena].icon} Arena Score!`,
        `${activeDog.name} scored ${score} points!\nCheck the leaderboard to see your rank.`
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>⚔️ Arena</Text>
      <Text style={styles.pageSubtitle}>
        {isUnlocked ? 'Compete for glory and rewards!' : `Unlocks at Level 20 (You: Lv.${activeDog?.level || 1})`}
      </Text>

      {/* Arena Cards */}
      <View style={styles.arenaGrid}>
        {(Object.entries(ARENA_CONFIG) as [ArenaType, typeof ARENA_CONFIG.agility][]).map(([type, config]) => (
          <TouchableOpacity
            key={type}
            onPress={() => { setSelectedArena(type); loadLeaderboard(type); }}
            style={[styles.arenaCard, selectedArena === type && styles.arenaCardSelected]}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isUnlocked ? config.gradient : ['#E5E7EB', '#D1D5DB']}
              style={styles.arenaCardGradient}
            >
              {!isUnlocked && <Text style={styles.lockOverlay}>🔒</Text>}
              <Text style={styles.arenaIcon}>{config.icon}</Text>
              <Text style={styles.arenaName}>{config.name}</Text>
              <Text style={styles.arenaDesc} numberOfLines={2}>{config.desc}</Text>
              <View style={styles.arenaStats}>
                {config.stats.map((s) => <Text key={s} style={styles.arenaStat}>{s}</Text>)}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* Selected Arena Detail */}
      {selectedArena && (
        <>
          <Card style={styles.section}>
            <View style={styles.arenaDetailHeader}>
              <Text style={styles.arenaDetailTitle}>
                {ARENA_CONFIG[selectedArena].icon} {ARENA_CONFIG[selectedArena].name}
              </Text>
              {myResult && (
                <View style={styles.myScoreChip}>
                  <Text style={styles.myScoreText}>My score: {myResult.score}</Text>
                </View>
              )}
            </View>

            <Button
              title={isUnlocked ? `⚔️ Enter ${ARENA_CONFIG[selectedArena].name}` : '🔒 Unlocks at Level 20'}
              onPress={() => handleEnterArena(selectedArena)}
              loading={loading}
              disabled={!isUnlocked}
              size="lg"
            />
          </Card>

          {/* Leaderboard */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Leaderboard — {season}</Text>
            {leaderboard.length === 0 ? (
              <Text style={styles.emptyText}>No scores yet this season. Be first!</Text>
            ) : (
              leaderboard.map((result, i) => (
                <View
                  key={result.id ?? i}
                  style={[styles.leaderboardRow, result.dog_id === activeDog?.id && styles.leaderboardRowMe]}
                >
                  <Text style={styles.leaderboardRank}>{getRankEmoji(i)}</Text>
                  {result.dog?.avatar_url ? (
                    <Image source={{ uri: result.dog.avatar_url }} style={styles.leaderboardAvatar} />
                  ) : (
                    <View style={[styles.leaderboardAvatar, styles.leaderboardAvatarPlaceholder]}>
                      <Text>🐶</Text>
                    </View>
                  )}
                  <View style={styles.leaderboardInfo}>
                    <Text style={styles.leaderboardName}>
                      {result.dog?.name ?? 'Unknown'}
                    </Text>
                    <Text style={styles.leaderboardBreed}>
                      {result.dog?.breed ?? '—'}
                    </Text>
                  </View>
                  <Text style={styles.leaderboardScore}>
                    {result.score ?? 0} pts
                  </Text>
                </View>
              ))
            )}
          </Card>
        </>
      )}

      {/* Arena overview stats */}
      {!selectedArena && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>📖 How Arena Works</Text>
          <Text style={styles.howToText}>
            {'• Arena unlocks at Level 20\n• Your score is based on your dog\'s stats\n• Compete each season (monthly)\n• Top finishers earn exclusive badges\n• Premium users get priority access\n• Allocate stat points from Premium subscription'}
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}

function getRankEmoji(i: number) {
  if (i === 0) return '🥇';
  if (i === 1) return '🥈';
  if (i === 2) return '🥉';
  return `#${i + 1}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  pageTitle: { fontSize: FontSize.xxxl, fontWeight: FontWeight.black, color: Colors.text },
  pageSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: -8 },
  arenaGrid: { gap: Spacing.md },
  arenaCard: { borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadow.md },
  arenaCardSelected: { borderWidth: 2, borderColor: Colors.primary },
  arenaCardGradient: { padding: Spacing.xl, gap: Spacing.sm, position: 'relative' },
  lockOverlay: { position: 'absolute', top: Spacing.lg, right: Spacing.lg, fontSize: 24 },
  arenaIcon: { fontSize: 48 },
  arenaName: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: '#fff' },
  arenaDesc: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },
  arenaStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  arenaStat: {
    fontSize: FontSize.xs, color: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    fontWeight: FontWeight.semibold,
  },
  section: { gap: Spacing.md },
  arenaDetailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  arenaDetailTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  myScoreChip: { backgroundColor: `${Colors.primary}20`, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full },
  myScoreText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.bold },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontStyle: 'italic' },
  leaderboardRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  leaderboardRowMe: { backgroundColor: `${Colors.primary}08`, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.sm },
  leaderboardRank: { fontSize: FontSize.lg, width: 32, textAlign: 'center' },
  leaderboardAvatar: { width: 36, height: 36, borderRadius: 18 },
  leaderboardAvatarPlaceholder: { backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  leaderboardInfo: { flex: 1 },
  leaderboardName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  leaderboardBreed: { fontSize: FontSize.xs, color: Colors.textSecondary },
  leaderboardScore: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary },
  howToText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22 },
});
