import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Image, Dimensions,
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

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { activeDog, user, subscriptionTier } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<Location[]>([]);
  const [activeCompetition, setActiveCompetition] = useState<Competition | null>(null);
  const [recentBadge, setRecentBadge] = useState<(DogBadge & { badge: Badge }) | null>(null);
  const [mission, setMission] = useState<any>(null);

  const xpProgress = activeDog ? getXPProgressForCurrentLevel(activeDog.xp) : null;

  const load = useCallback(async () => {
    if (!activeDog) return;
    try {
      const [placesRes, compRes, badgeRes, missionRes] = await Promise.all([
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

      if (placesRes.data) setNearbyPlaces(placesRes.data);
      if (compRes.data) setActiveCompetition(compRes.data);
      if (badgeRes.data) setRecentBadge(badgeRes.data as any);
      if (missionRes.data) setMission(missionRes.data);
    } catch (e) {
      console.error('Home load error:', e);
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

  if (!activeDog) return null;

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
        <View>
          <Text style={styles.greeting}>
            Good {getGreeting()}, {user?.full_name?.split(' ')[0] || 'there'}! 👋
          </Text>
          <Text style={styles.tagline}>What's the adventure today?</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.userAvatar} />
          ) : (
            <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {user?.full_name?.[0]?.toUpperCase() || '?'}
              </Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>

      {/* Dog Card */}
      <LinearGradient
        colors={[tc + '22', tc + '08', '#FFFFFF']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.dogCard, { borderColor: tc + '40' }]}
      >
        <View style={styles.dogCardTop}>
          <View style={styles.dogAvatarWrap}>
            {subscriptionTier !== 'free' && (
              <LinearGradient
                colors={subscriptionTier === 'premium_pro' ? [Colors.gold, Colors.goldDark] : [Colors.silver, Colors.silverDark]}
                style={styles.dogAvatarFrame}
              />
            )}
            {activeDog.avatar_url ? (
              <Image source={{ uri: activeDog.avatar_url }} style={styles.dogAvatar} />
            ) : (
              <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.dogAvatar}>
                <Text style={styles.dogAvatarEmoji}>🐶</Text>
              </LinearGradient>
            )}
            {activeDog.streak_days >= 7 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥{activeDog.streak_days}</Text>
              </View>
            )}
          </View>

          <View style={styles.dogInfo}>
            <View style={styles.dogNameRow}>
              <Text style={styles.dogName}>{activeDog.name}</Text>
              <PremiumBadge tier={subscriptionTier} size="sm" />
            </View>
            <View style={[styles.tierChip, { backgroundColor: tc + '20', borderColor: tc + '60' }]}>
              <Text style={[styles.tierText, { color: tc }]}>{activeDog.tier}</Text>
            </View>
            <Text style={styles.dogBreed}>{activeDog.breed}</Text>
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
          </View>
        )}
      </LinearGradient>

      {/* Current Mission */}
      {mission && (
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎯 Current Mission</Text>
          </View>
          <View style={styles.missionRow}>
            <Text style={styles.missionIcon}>{mission.mission?.icon || '🎯'}</Text>
            <View style={styles.missionInfo}>
              <Text style={styles.missionName}>{mission.mission?.title}</Text>
              <Text style={styles.missionDesc}>{mission.mission?.description}</Text>
              <View style={styles.missionProgressBar}>
                <View style={[styles.missionProgressFill, {
                  width: `${Math.min((mission.progress / (mission.mission?.target || 1)) * 100, 100)}%`
                }]} />
              </View>
              <Text style={styles.missionProgress}>
                {mission.progress}/{mission.mission?.target} · +{mission.mission?.xp_reward} XP
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* Nearby Places */}
      {nearbyPlaces.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📍 Nearby Places</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Map')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {nearbyPlaces.map((place) => (
              <TouchableOpacity
                key={place.id}
                style={styles.placeCard}
                onPress={() => navigation.navigate('LocationDetail', { location: place })}
              >
                <Text style={styles.placeEmoji}>{getCategoryEmoji(place.category)}</Text>
                <Text style={styles.placeName} numberOfLines={2}>{place.name}</Text>
                {place.rating && (
                  <Text style={styles.placeRating}>⭐ {place.rating}</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Active Competition */}
      {activeCompetition && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Competition', { competition: activeCompetition })}
        >
          <LinearGradient
            colors={[Colors.secondary, Colors.gold]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.competitionBanner}
          >
            <Text style={styles.competitionEmoji}>🏆</Text>
            <View style={styles.competitionInfo}>
              <Text style={styles.competitionLabel}>ACTIVE COMPETITION</Text>
              <Text style={styles.competitionTitle}>{activeCompetition.title}</Text>
              <Text style={styles.competitionPrize}>+{activeCompetition.prize_xp} XP prize</Text>
            </View>
            <Text style={styles.competitionArrow}>›</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Recent Badge */}
      {recentBadge && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>🏅 Latest Badge</Text>
          <View style={styles.badgeRow}>
            <Text style={styles.badgeIcon}>{recentBadge.badge?.icon}</Text>
            <View>
              <Text style={styles.badgeName}>{recentBadge.badge?.name}</Text>
              <Text style={styles.badgeDesc}>{recentBadge.badge?.description}</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Premium CTA */}
      {subscriptionTier === 'free' && (
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.premiumCTA}
        >
          <Text style={styles.premiumCTATitle}>✨ Unlock Premium</Text>
          <Text style={styles.premiumCTADesc}>2x XP boost, silver frame, advanced filters & more</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  tagline: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  userAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },
  userAvatarText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.lg },

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
  },
  streakText: { fontSize: 10, fontWeight: FontWeight.bold },
  dogInfo: { flex: 1, gap: 6 },
  dogNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dogName: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.text },
  tierChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tierText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  dogBreed: { fontSize: FontSize.sm, color: Colors.textSecondary },
  xpSection: { marginTop: Spacing.sm },

  section: { gap: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  seeAll: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },

  horizontalScroll: { marginHorizontal: -Spacing.lg },
  placeCard: {
    width: 130,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginLeft: Spacing.lg,
    gap: 6,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.sm,
  },
  placeEmoji: { fontSize: 28 },
  placeName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text, lineHeight: 18 },
  placeRating: { fontSize: FontSize.xs, color: Colors.textSecondary },

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
  competitionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.black, color: '#1A1A2E', opacity: 0.6, letterSpacing: 1 },
  competitionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black, color: '#1A1A2E' },
  competitionPrize: { fontSize: FontSize.sm, color: '#1A1A2E', opacity: 0.7 },
  competitionArrow: { fontSize: 28, color: '#1A1A2E', opacity: 0.5 },

  missionRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  missionIcon: { fontSize: 32 },
  missionInfo: { flex: 1, gap: 4 },
  missionName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  missionDesc: { fontSize: FontSize.sm, color: Colors.textSecondary },
  missionProgressBar: {
    height: 6, backgroundColor: Colors.xpBackground,
    borderRadius: BorderRadius.full, overflow: 'hidden', marginTop: 4,
  },
  missionProgressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: BorderRadius.full },
  missionProgress: { fontSize: FontSize.xs, color: Colors.textSecondary },

  badgeRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  badgeIcon: { fontSize: 40 },
  badgeName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  badgeDesc: { fontSize: FontSize.sm, color: Colors.textSecondary },

  premiumCTA: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: Spacing.sm,
    ...Shadow.colored(Colors.primary),
  },
  premiumCTATitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: '#fff' },
  premiumCTADesc: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },
  premiumCTABtn: { alignSelf: 'flex-start', marginTop: Spacing.sm },
});
