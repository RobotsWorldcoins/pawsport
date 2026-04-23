import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import supabase from '../../services/supabase';
import { authService } from '../../services/auth';
import { getXPProgressForCurrentLevel } from '../../services/xp';
import { useAppStore } from '../../store';
import XPBar from '../../components/common/XPBar';
import PremiumBadge from '../../components/common/PremiumBadge';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';
import { ARENA_STATS } from '../../constants';
import type { DogBadge, Badge, Checkin, DogStats } from '../../types';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { activeDog, user, subscriptionTier, dogStats, setDogStats, reset } = useAppStore();
  const [badges, setBadges] = useState<(DogBadge & { badge: Badge })[]>([]);
  const [recentCheckins, setRecentCheckins] = useState<Checkin[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DogStats | null>(null);

  const xpProgress = activeDog ? getXPProgressForCurrentLevel(activeDog.xp) : null;

  const tierColor = (tier: string) => {
    const map: Record<string, string> = {
      Puppy: Colors.tierPuppy, Junior: Colors.tierJunior, Explorer: Colors.tierExplorer,
      Adventurer: Colors.tierAdventurer, Tracker: Colors.tierTracker, Challenger: Colors.tierChallenger,
      Champion: Colors.tierChampion, Elite: Colors.tierElite, Legend: Colors.tierLegend, 'Mythic Dog': Colors.tierMythic,
    };
    return map[tier] || Colors.primary;
  };

  const load = useCallback(async () => {
    if (!activeDog) return;
    const [badgesRes, checkinsRes, statsRes] = await Promise.all([
      supabase.from('dog_badges').select('*, badge:badges(*)').eq('dog_id', activeDog.id).order('earned_at', { ascending: false }).limit(12),
      supabase.from('checkins').select('*, location:locations(name,category)').eq('dog_id', activeDog.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('dog_stats').select('*').eq('dog_id', activeDog.id).maybeSingle(),
    ]);
    if (badgesRes.data) setBadges(badgesRes.data as any);
    if (checkinsRes.data) setRecentCheckins(checkinsRes.data as any);
    if (statsRes.data) { setStats(statsRes.data); setDogStats(statsRes.data); }
  }, [activeDog]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleSignOut = async () => {
    await authService.signOut();
    reset();
  };

  if (!activeDog || !user) return null;
  const tc = tierColor(activeDog.tier);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: 100 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>🐾 Profile</Text>
        <View style={styles.headerActions}>
          <PremiumBadge tier={subscriptionTier} />
          <TouchableOpacity onPress={() => navigation.navigate('Premium')} style={styles.settingsBtn}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dog Hero Card */}
      <LinearGradient
        colors={[tc + '22', tc + '08', '#FFF']}
        style={[styles.heroCard, { borderColor: tc + '40' }]}
      >
        <View style={styles.heroTop}>
          {/* Avatar with premium frame */}
          <View style={styles.avatarWrap}>
            {subscriptionTier !== 'free' && (
              <LinearGradient
                colors={subscriptionTier === 'premium_pro' ? [Colors.gold, Colors.goldDark, Colors.gold] : [Colors.silver, Colors.silverDark, Colors.silver]}
                style={styles.avatarFrame}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />
            )}
            {activeDog.avatar_url ? (
              <Image source={{ uri: activeDog.avatar_url }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.avatar}>
                <Text style={styles.avatarEmoji}>🐶</Text>
              </LinearGradient>
            )}
          </View>

          <View style={styles.heroInfo}>
            <Text style={styles.dogName}>{activeDog.name}</Text>
            <Text style={styles.dogBreed}>{activeDog.breed}</Text>
            <View style={[styles.tierChip, { backgroundColor: tc + '20', borderColor: tc + '60' }]}>
              <Text style={[styles.tierText, { color: tc }]}>
                Lv.{activeDog.level} · {activeDog.tier}
              </Text>
            </View>
            {activeDog.streak_days >= 3 && (
              <View style={styles.streakRow}>
                <Text style={styles.streakEmoji}>🔥</Text>
                <Text style={styles.streakLabel}>{activeDog.streak_days}-day streak</Text>
              </View>
            )}
          </View>
        </View>

        {xpProgress && (
          <View style={styles.xpSection}>
            <XPBar
              current={xpProgress.current}
              needed={xpProgress.needed}
              percentage={xpProgress.percentage}
              level={xpProgress.level}
            />
            <Text style={styles.totalXP}>Total XP: {activeDog.xp.toLocaleString()}</Text>
          </View>
        )}

        {activeDog.personality_tags?.length > 0 && (
          <View style={styles.tagsRow}>
            {activeDog.personality_tags.map((tag) => (
              <View key={tag} style={styles.personalityTag}>
                <Text style={styles.personalityTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </LinearGradient>

      {/* Stats Grid */}
      {stats && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>⚔️ Arena Stats</Text>
          {stats.stat_points_available > 0 && (
            <View style={styles.statPointsBadge}>
              <Text style={styles.statPointsText}>+{stats.stat_points_available} points available!</Text>
            </View>
          )}
          <View style={styles.statsGrid}>
            {Object.entries(ARENA_STATS).map(([key, info]) => {
              const val = stats[key as keyof DogStats] as number || 50;
              return (
                <View key={key} style={styles.statItem}>
                  <Text style={styles.statIcon}>{info.icon}</Text>
                  <Text style={styles.statLabel}>{info.label}</Text>
                  <View style={styles.statBarTrack}>
                    <View style={[styles.statBarFill, { width: `${Math.min(val / 200 * 100, 100)}%`, backgroundColor: info.color }]} />
                  </View>
                  <Text style={styles.statValue}>{val}</Text>
                </View>
              );
            })}
          </View>
        </Card>
      )}

      {/* Badges */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🏅 Badges ({badges.length})</Text>
        </View>
        {badges.length === 0 ? (
          <Text style={styles.emptyText}>No badges yet — go explore! 🐾</Text>
        ) : (
          <View style={styles.badgeGrid}>
            {badges.map((db) => (
              <TouchableOpacity
                key={db.id}
                style={styles.badgeItem}
                onPress={() => navigation.navigate('BadgeDetail', { badge: db.badge, earnedAt: db.earned_at })}
              >
                <Text style={styles.badgeEmoji}>{db.badge?.icon}</Text>
                <Text style={styles.badgeName} numberOfLines={2}>{db.badge?.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Card>

      {/* Recent Checkins */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Recent Adventures</Text>
        {recentCheckins.length === 0 ? (
          <Text style={styles.emptyText}>No check-ins yet — head to the Map! 🗺️</Text>
        ) : (
          recentCheckins.map((ci: any) => (
            <View key={ci.id} style={styles.checkinItem}>
              <Text style={styles.checkinEmoji}>{getEmoji(ci.location?.category)}</Text>
              <View style={styles.checkinInfo}>
                <Text style={styles.checkinName}>{ci.location?.name || 'Unknown place'}</Text>
                <Text style={styles.checkinMeta}>+{ci.xp_earned} XP · {new Date(ci.created_at).toLocaleDateString()}</Text>
              </View>
            </View>
          ))
        )}
      </Card>

      {/* Premium CTA */}
      {subscriptionTier === 'free' && (
        <Button
          title="✨ Unlock Premium — €9.99/mo"
          onPress={() => navigation.navigate('Premium')}
          variant="premium"
          size="lg"
        />
      )}

      {/* Invite Friends */}
      <Button
        title="🎁 Invite Friends & Earn XP"
        onPress={() => navigation.navigate('Referral')}
        variant="outline"
        size="lg"
      />

      {/* Legal links */}
      <View style={styles.legalRow}>
        <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')}>
          <Text style={styles.legalLink}>Terms of Service</Text>
        </TouchableOpacity>
        <Text style={styles.legalDot}>·</Text>
        <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function getEmoji(cat: string) {
  const map: Record<string, string> = { dog_park: '🌳', beach: '🏖️', trail: '🥾', veterinarian: '🏥', trainer: '🎓', grooming: '✂️', cafe: '☕', hotel: '🏨', event: '🎉' };
  return map[cat] || '📍';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.text },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingsBtn: { padding: 4 },
  settingsIcon: { fontSize: 22 },

  heroCard: { borderRadius: BorderRadius.xxl, borderWidth: 1.5, padding: Spacing.xl, gap: Spacing.lg, ...Shadow.md },
  heroTop: { flexDirection: 'row', gap: Spacing.lg, alignItems: 'center' },
  avatarWrap: { position: 'relative' },
  avatarFrame: { position: 'absolute', width: 86, height: 86, borderRadius: 43, top: -4, left: -4, zIndex: 0 },
  avatar: { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  avatarEmoji: { fontSize: 40 },
  heroInfo: { flex: 1, gap: 6 },
  dogName: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.text },
  dogBreed: { fontSize: FontSize.sm, color: Colors.textSecondary },
  tierChip: { alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1 },
  tierText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakEmoji: { fontSize: 16 },
  streakLabel: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.semibold },
  xpSection: { gap: 4 },
  totalXP: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'right' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  personalityTag: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full, backgroundColor: `${Colors.primary}15` },
  personalityTagText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.medium },

  section: { gap: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontStyle: 'italic' },

  statPointsBadge: { backgroundColor: `${Colors.accent}20`, padding: Spacing.sm, borderRadius: BorderRadius.md },
  statPointsText: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: FontWeight.bold },
  statsGrid: { gap: Spacing.sm },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  statLabel: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium, width: 70 },
  statBarTrack: { flex: 1, height: 8, backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.full, overflow: 'hidden' },
  statBarFill: { height: '100%', borderRadius: BorderRadius.full },
  statValue: { fontSize: FontSize.xs, color: Colors.textSecondary, width: 30, textAlign: 'right' },

  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeItem: { width: 72, alignItems: 'center', gap: 4 },
  badgeEmoji: { fontSize: 36 },
  badgeName: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center', lineHeight: 13 },

  checkinItem: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  checkinEmoji: { fontSize: 24, width: 32, textAlign: 'center' },
  checkinInfo: { flex: 1 },
  checkinName: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.text },
  checkinMeta: { fontSize: FontSize.xs, color: Colors.textSecondary },

  legalRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  legalLink: { fontSize: FontSize.xs, color: Colors.textMuted, textDecorationLine: 'underline' },
  legalDot: { fontSize: FontSize.xs, color: Colors.textMuted },
  signOutBtn: { alignItems: 'center', paddingVertical: Spacing.lg },
  signOutText: { fontSize: FontSize.md, color: Colors.error, fontWeight: FontWeight.medium },
});
