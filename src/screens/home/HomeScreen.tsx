import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Image, Dimensions, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store';
import supabase from '../../services/supabase';
import { getXPProgressForCurrentLevel } from '../../services/xp';
import XPBar from '../../components/common/XPBar';
import PremiumBadge from '../../components/common/PremiumBadge';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';
import type { Location, Competition, Badge, DogBadge } from '../../types';

const { width } = Dimensions.get('window');

// ─── Skeleton shimmer placeholder ────────────────────────────────────────────
function SkeletonBlock({ w, h, radius = 8, style }: { w: number | string; h: number; radius?: number; style?: any }) {
  return (
    <View
      style={[
        { width: w as any, height: h, borderRadius: radius, backgroundColor: Colors.border, opacity: 0.5 },
        style,
      ]}
    />
  );
}

function DogCardSkeleton() {
  return (
    <View style={[skeletonStyles.card, Shadow.md]}>
      <View style={skeletonStyles.top}>
        <SkeletonBlock w={70} h={70} radius={35} />
        <View style={skeletonStyles.info}>
          <SkeletonBlock w={120} h={18} radius={6} />
          <SkeletonBlock w={80} h={14} radius={6} style={{ marginTop: 8 }} />
          <SkeletonBlock w={60} h={12} radius={6} style={{ marginTop: 6 }} />
        </View>
      </View>
      <SkeletonBlock w="100%" h={10} radius={5} style={{ marginTop: 16 }} />
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { activeDog, user, subscriptionTier } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nearbyPlaces, setNearbyPlaces] = useState<Location[]>([]);
  const [activeCompetition, setActiveCompetition] = useState<Competition | null>(null);
  const [recentBadge, setRecentBadge] = useState<(DogBadge & { badge: Badge }) | null>(null);
  const [mission, setMission] = useState<any>(null);

  const xpProgress = activeDog ? getXPProgressForCurrentLevel(activeDog.xp) : null;

  const load = useCallback(async () => {
    if (!activeDog) {
      setLoading(false);
      return;
    }
    try {
      const [placesRes, compRes, badgeRes, missionRes] = await Promise.allSettled([
        supabase.from('locations').select('*').eq('city', activeDog.city).limit(3),
        supabase.from('competitions').select('*').eq('status', 'active').limit(1).maybeSingle(),
        supabase
          .from('dog_badges')
          .select('*, badge:badges(*)')
          .eq('dog_id', activeDog.id)
          .order('earned_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('dog_missions')
          .select('*, mission:missions(*)')
          .eq('dog_id', activeDog.id)
          .eq('completed', false)
          .limit(1)
          .maybeSingle(),
      ]);

      // Each result is fulfilled/rejected — extract data safely
      if (placesRes.status === 'fulfilled' && placesRes.value.data) {
        setNearbyPlaces(placesRes.value.data);
      } else {
        setNearbyPlaces([]);
      }

      if (compRes.status === 'fulfilled' && compRes.value.data) {
        setActiveCompetition(compRes.value.data);
      } else {
        setActiveCompetition(null);
      }

      if (badgeRes.status === 'fulfilled' && badgeRes.value.data) {
        setRecentBadge(badgeRes.value.data as any);
      } else {
        setRecentBadge(null);
      }

      if (missionRes.status === 'fulfilled' && missionRes.value.data) {
        setMission(missionRes.value.data);
      } else {
        setMission(null);
      }
    } catch (e) {
      // Outer catch: belt + suspenders — set all to empty rather than crash
      console.error('Home load error:', e);
      setNearbyPlaces([]);
      setActiveCompetition(null);
      setRecentBadge(null);
      setMission(null);
    } finally {
      setLoading(false);
    }
  }, [activeDog]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const tierColor = (tier: string) => {
    const map: Record<string, string> = {
      'Puppy': Colors.tierPuppy, 'Junior': Colors.tierJunior,
      'Explorer': Colors.tierExplorer, 'Adventurer': Colors.tierAdventurer,
      'Tracker': Colors.tierTracker, 'Challenger': Colors.tierChallenger,
      'Champion': Colors.tierChampion, 'Elite': Colors.tierElite,
      'Legend': Colors.tierLegend, 'Mythic Dog': Colors.tierMythic,
    };
    return map[tier] || Colors.primary;
  };

  // ── Show skeleton when dog data is still loading ──────────────────────────
  if (loading && !activeDog) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingHorizontal: Spacing.lg }]}>
        <View style={styles.headerRow}>
          <View>
            <SkeletonBlock w={160} h={22} radius={6} />
            <SkeletonBlock w={120} h={14} radius={6} style={{ marginTop: 8 }} />
          </View>
          <SkeletonBlock w={44} h={44} radius={22} />
        </View>
        <DogCardSkeleton />
      </View>
    );
  }

  // ── Guard: no active dog ──────────────────────────────────────────────────
  if (!activeDog) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>🐾</Text>
        <Text style={styles.emptyTitle}>No dog profile yet</Text>
        <Text style={styles.emptyDesc}>Add your first dog to get started!</Text>
      </View>
    );
  }

  const tc = tierColor(activeDog.tier);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: 100 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, marginRight: Spacing.md }}>
          <Text style={styles.greeting} numberOfLines={1}>
            Good {getGreeting()}, {user?.full_name?.split(' ')[0] || 'there'}! 👋
          </Text>
          <Text style={styles.tagline}>What's the adventure today?</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.userAvatar} />
          ) : (
            <LinearGradient
              colors={[Colors.primaryLight, Colors.primary]}
              style={styles.userAvatar}
            >
              <Text style={styles.userAvatarText}>
                {user?.full_name?.[0]?.toUpperCase() || '?'}
              </Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Dog Hero Card ────────────────────────────────────────────────── */}
      <LinearGradient
        colors={[tc + '28', tc + '0C', Colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.dogCard, { borderColor: tc + '45' }]}
      >
        <View style={styles.dogCardTop}>
          {/* Avatar */}
          <View style={styles.dogAvatarWrap}>
            {subscriptionTier !== 'free' && (
              <LinearGradient
                colors={
                  subscriptionTier === 'premium_pro'
                    ? [Colors.gold, Colors.goldDark]
                    : [Colors.silver, Colors.silverDark]
                }
                style={styles.dogAvatarFrame}
              />
            )}
            {activeDog.avatar_url ? (
              <Image source={{ uri: activeDog.avatar_url }} style={styles.dogAvatar} />
            ) : (
              <LinearGradient
                colors={[Colors.primaryLight, Colors.primary]}
                style={styles.dogAvatar}
              >
                <Text style={styles.dogAvatarEmoji}>🐶</Text>
              </LinearGradient>
            )}
            {activeDog.streak_days >= 7 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥{activeDog.streak_days}</Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.dogInfo}>
            <View style={styles.dogNameRow}>
              <Text style={styles.dogName} numberOfLines={1}>{activeDog.name}</Text>
              <PremiumBadge tier={subscriptionTier} size="sm" />
            </View>
            <View style={[styles.tierChip, { backgroundColor: tc + '22', borderColor: tc + '55' }]}>
              <Text style={[styles.tierText, { color: tc }]}>{activeDog.tier}</Text>
            </View>
            <Text style={styles.dogBreed}>{activeDog.breed}</Text>
          </View>
        </View>

        {/* XP Bar */}
        {xpProgress && (
          <View style={styles.xpSection}>
            <XPBar
              current={xpProgress.current}
              needed={xpProgress.needed}
              percentage={xpProgress.percentage}
              level={xpProgress.level}
            />
          </View>
        )}
      </LinearGradient>

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <View style={styles.quickActions}>
        {[
          { icon: '🗺️', label: 'Explore', screen: 'Map' },
          { icon: '📸', label: 'Check In', screen: 'Checkin' },
          { icon: '⚔️', label: 'Arena', screen: 'Arena' },
          { icon: '🎁', label: 'Rewards', screen: 'Premium' },
        ].map((action) => (
          <TouchableOpacity
            key={action.screen}
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate(action.screen)}
            activeOpacity={0.75}
          >
            <View style={styles.quickActionIcon}>
              <Text style={styles.quickActionEmoji}>{action.icon}</Text>
            </View>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Current Mission ──────────────────────────────────────────────── */}
      {mission && (
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎯 Current Mission</Text>
          </View>
          <View style={styles.missionRow}>
            <Text style={styles.missionIcon}>{mission.mission?.icon || '🎯'}</Text>
            <View style={styles.missionInfo}>
              <Text style={styles.missionName}>{mission.mission?.title || 'Mission'}</Text>
              <Text style={styles.missionDesc} numberOfLines={2}>
                {mission.mission?.description || ''}
              </Text>
              <View style={styles.missionProgressBar}>
                <View
                  style={[
                    styles.missionProgressFill,
                    { width: `${Math.min(((mission.progress || 0) / (mission.mission?.target || 1)) * 100, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.missionProgress}>
                {mission.progress || 0}/{mission.mission?.target || 1} · +{mission.mission?.xp_reward || 0} XP
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* ── Nearby Places ────────────────────────────────────────────────── */}
      {nearbyPlaces.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📍 Nearby Places</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Map')} activeOpacity={0.7}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
            contentContainerStyle={{ paddingLeft: Spacing.lg, paddingRight: Spacing.md }}
          >
            {nearbyPlaces.map((place) => (
              <TouchableOpacity
                key={place.id}
                style={styles.placeCard}
                onPress={() => navigation.navigate('LocationDetail', { location: place })}
                activeOpacity={0.8}
              >
                <Text style={styles.placeEmoji}>{getCategoryEmoji(place.category)}</Text>
                <Text style={styles.placeName} numberOfLines={2}>{place.name}</Text>
                {place.rating != null && (
                  <Text style={styles.placeRating}>⭐ {place.rating}</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Active Competition ───────────────────────────────────────────── */}
      {activeCompetition && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Competition', { competition: activeCompetition })}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={[Colors.secondary, Colors.gold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.competitionBanner}
          >
            <Text style={styles.competitionEmoji}>🏆</Text>
            <View style={styles.competitionInfo}>
              <Text style={styles.competitionLabel}>ACTIVE COMPETITION</Text>
              <Text style={styles.competitionTitle} numberOfLines={1}>
                {activeCompetition.title}
              </Text>
              <Text style={styles.competitionPrize}>
                +{activeCompetition.prize_xp ?? 0} XP prize
              </Text>
            </View>
            <Text style={styles.competitionArrow}>›</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* ── Recent Badge ─────────────────────────────────────────────────── */}
      {recentBadge && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>🏅 Latest Badge</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badgeIconWrap}>
              <Text style={styles.badgeIcon}>{recentBadge.badge?.icon ?? '🏅'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.badgeName}>{recentBadge.badge?.name ?? 'Badge'}</Text>
              <Text style={styles.badgeDesc} numberOfLines={2}>
                {recentBadge.badge?.description ?? ''}
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* ── Premium CTA ──────────────────────────────────────────────────── */}
      {subscriptionTier === 'free' && (
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.premiumCTA}
        >
          <Text style={styles.premiumCTATitle}>✨ Unlock Premium</Text>
          <Text style={styles.premiumCTADesc}>
            2x XP boost, silver frame, advanced filters & more
          </Text>
          <Button
            title="Go Premium — €9.99/mo"
            onPress={() => navigation.navigate('Premium')}
            variant="secondary"
            size="sm"
            style={styles.premiumCTABtn}
          />
        </LinearGradient>
      )}
    </ScrollView>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function getCategoryEmoji(cat: string) {
  const map: Record<string, string> = {
    dog_park: '🌳', beach: '🏖️', trail: '🥾',
    veterinarian: '🏥', trainer: '🎓', grooming: '✂️',
    cafe: '☕', hotel: '🏨', event: '🎉',
  };
  return map[cat] || '📍';
}

// ─── Skeleton styles ──────────────────────────────────────────────────────────
const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
  },
  top: { flexDirection: 'row', gap: Spacing.lg, alignItems: 'center' },
  info: { flex: 1, gap: 0 },
});

// ─── Main styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },

  // Empty state
  emptyState: {
    flex: 1, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', gap: Spacing.md,
    padding: Spacing.xxxl,
  },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text, textAlign: 'center' },
  emptyDesc: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  tagline: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 3 },
  userAvatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.md,
  },
  userAvatarText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.lg },

  // Dog hero card
  dogCard: {
    borderRadius: BorderRadius.xxl,
    borderWidth: 1.5,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.md,
  },
  dogCardTop: { flexDirection: 'row', gap: Spacing.lg, alignItems: 'center' },
  dogAvatarWrap: { position: 'relative' },
  dogAvatarFrame: {
    position: 'absolute',
    width: 76, height: 76, borderRadius: 38,
    top: -3, left: -3, zIndex: 0,
  },
  dogAvatar: {
    width: 70, height: 70, borderRadius: 35,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1,
  },
  dogAvatarEmoji: { fontSize: 36 },
  streakBadge: {
    position: 'absolute', bottom: -4, right: -4,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: Colors.border,
    zIndex: 2,
    ...Shadow.sm,
  },
  streakText: { fontSize: 10, fontWeight: FontWeight.bold },
  dogInfo: { flex: 1, gap: 6 },
  dogNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  dogName: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.text, flexShrink: 1 },
  tierChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tierText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  dogBreed: { fontSize: FontSize.sm, color: Colors.textSecondary },
  xpSection: { marginTop: Spacing.xs },

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  quickActionBtn: { alignItems: 'center', gap: 6, flex: 1 },
  quickActionIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.sm,
  },
  quickActionEmoji: { fontSize: 22 },
  quickActionLabel: { fontSize: 10, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textAlign: 'center' },

  // Sections
  section: { gap: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  seeAll: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },

  // Places
  horizontalScroll: { marginHorizontal: -Spacing.lg },
  placeCard: {
    width: 132,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    gap: 6,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.sm,
  },
  placeEmoji: { fontSize: 28 },
  placeName: {
    fontSize: FontSize.sm, fontWeight: FontWeight.semibold,
    color: Colors.text, lineHeight: 18,
  },
  placeRating: { fontSize: FontSize.xs, color: Colors.textSecondary },

  // Competition
  competitionBanner: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.colored(Colors.secondary),
  },
  competitionEmoji: { fontSize: 36 },
  competitionInfo: { flex: 1 },
  competitionLabel: {
    fontSize: FontSize.xs, fontWeight: FontWeight.black,
    color: Colors.text, opacity: 0.55, letterSpacing: 1,
  },
  competitionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black, color: Colors.text },
  competitionPrize: { fontSize: FontSize.sm, color: Colors.text, opacity: 0.7 },
  competitionArrow: { fontSize: 28, color: Colors.text, opacity: 0.45 },

  // Mission
  missionRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  missionIcon: { fontSize: 32 },
  missionInfo: { flex: 1, gap: 4 },
  missionName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  missionDesc: { fontSize: FontSize.sm, color: Colors.textSecondary },
  missionProgressBar: {
    height: 7, backgroundColor: Colors.xpBackground,
    borderRadius: BorderRadius.full, overflow: 'hidden', marginTop: 6,
  },
  missionProgressFill: {
    height: '100%', backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  missionProgress: { fontSize: FontSize.xs, color: Colors.textSecondary },

  // Badge
  badgeRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  badgeIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  badgeIcon: { fontSize: 32 },
  badgeName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  badgeDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

  // Premium CTA
  premiumCTA: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: Spacing.sm,
    ...Shadow.colored(Colors.primary),
  },
  premiumCTATitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: '#fff' },
  premiumCTADesc: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.88)', lineHeight: 20 },
  premiumCTABtn: { alignSelf: 'flex-start', marginTop: Spacing.sm },
});
