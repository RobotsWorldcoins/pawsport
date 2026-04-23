import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, RefreshControl,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import supabase from '../../services/supabase';
import { awardXP } from '../../services/xp';
import { useAppStore } from '../../store';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';
import type { Competition, CompetitionEntry, Dog } from '../../types';

export default function CompetitionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { activeDog, user, subscriptionTier } = useAppStore();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [entries, setEntries] = useState<Record<string, (CompetitionEntry & { dog: Dog })[]>>({});
  const [myEntries, setMyEntries] = useState<Record<string, CompetitionEntry>>({});
  const [votedComps, setVotedComps] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data: comps } = await supabase
      .from('competitions')
      .select('*')
      .in('status', ['active', 'upcoming'])
      .order('created_at', { ascending: false });

    if (comps) {
      setCompetitions(comps);
      const entriesMap: Record<string, any[]> = {};
      const myMap: Record<string, any> = {};

      for (const comp of comps) {
        const { data: compEntries } = await supabase
          .from('competition_entries')
          .select('*, dog:dogs(*)')
          .eq('competition_id', comp.id)
          .order('votes', { ascending: false })
          .limit(10);
        if (compEntries) entriesMap[comp.id] = compEntries;

        if (activeDog) {
          const { data: myEntry } = await supabase
            .from('competition_entries')
            .select('*')
            .eq('competition_id', comp.id)
            .eq('dog_id', activeDog.id)
            .maybeSingle();
          if (myEntry) myMap[comp.id] = myEntry;
        }

        if (user) {
          const { data: myVote } = await supabase
            .from('competition_votes')
            .select('id')
            .eq('competition_id', comp.id)
            .eq('voter_id', user.id)
            .maybeSingle();
          if (myVote) setVotedComps((prev) => new Set([...prev, comp.id]));
        }
      }
      setEntries(entriesMap);
      setMyEntries(myMap);
    }
  }, [activeDog, user]);

  useEffect(() => { load(); }, [load]);

  const handleEnter = async (competition: Competition) => {
    if (!activeDog) return;

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.85,
    });
    if (res.canceled) return;

    try {
      const uri = res.assets[0].uri;
      const ext = uri.split('.').pop();
      const path = `competitions/${competition.id}/${activeDog.id}.${ext}`;
      const response = await fetch(uri);
      const blob = await response.blob();
      await supabase.storage.from('competition-photos').upload(path, blob, { upsert: true });
      const { data: urlData } = supabase.storage.from('competition-photos').getPublicUrl(path);

      await supabase.from('competition_entries').upsert(
        { competition_id: competition.id, dog_id: activeDog.id, photo_url: urlData.publicUrl, votes: 0 },
        { onConflict: 'competition_id,dog_id' }
      );

      await awardXP(activeDog.id, 'event', competition.id, subscriptionTier, activeDog.streak_days);
      await load();
      Alert.alert('✅ Entered!', `${activeDog.name} is now in the competition! Share to get votes!`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleVote = async (competition: Competition, entry: CompetitionEntry) => {
    if (!user) return;
    if (votedComps.has(competition.id)) {
      Alert.alert('Already voted', 'You can only vote once per competition.');
      return;
    }
    if (entry.dog_id === activeDog?.id) {
      Alert.alert('Can\'t vote for yourself', 'You cannot vote for your own dog.');
      return;
    }

    try {
      await supabase.from('competition_votes').insert({
        competition_id: competition.id,
        entry_id: entry.id,
        voter_id: user.id,
      });
      await supabase
        .from('competition_entries')
        .update({ votes: entry.votes + 1 })
        .eq('id', entry.id);

      setVotedComps((prev) => new Set([...prev, competition.id]));
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: 100 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <Text style={styles.pageTitle}>🏆 Competitions</Text>
      <Text style={styles.pageSubtitle}>Monthly contests — enter, vote, win prizes!</Text>

      {competitions.map((comp) => {
        const compEntries = entries[comp.id] || [];
        const myEntry = myEntries[comp.id];
        const hasVoted = votedComps.has(comp.id);

        return (
          <Card key={comp.id} style={styles.compCard}>
            <View style={styles.compHeader}>
              <View>
                <View style={[styles.statusChip, comp.status === 'active' ? styles.statusActive : styles.statusUpcoming]}>
                  <Text style={styles.statusText}>{comp.status === 'active' ? '● LIVE' : 'UPCOMING'}</Text>
                </View>
                <Text style={styles.compTitle}>{comp.title}</Text>
                <Text style={styles.compDesc}>{comp.description}</Text>
                <Text style={styles.compPrize}>🏆 Prize: +{comp.prize_xp} XP</Text>
                <Text style={styles.compDate}>
                  {new Date(comp.start_date).toLocaleDateString()} – {new Date(comp.end_date).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {comp.status === 'active' && !myEntry && (
              <Button
                title="📸 Enter Competition"
                onPress={() => handleEnter(comp)}
                size="md"
              />
            )}
            {myEntry && (
              <View style={styles.myEntryBanner}>
                <Text style={styles.myEntryText}>✅ Entered! {myEntry.votes} votes so far</Text>
              </View>
            )}

            {/* Entries / Voting */}
            {compEntries.length > 0 && (
              <View style={styles.entriesSection}>
                <Text style={styles.entriesTitle}>Contestants ({compEntries.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {compEntries.map((entry: any, i) => (
                    <View key={entry.id} style={styles.entryCard}>
                      {i < 3 && <Text style={styles.entryRankBadge}>{['🥇', '🥈', '🥉'][i]}</Text>}
                      {entry.photo_url ? (
                        <Image source={{ uri: entry.photo_url }} style={styles.entryPhoto} />
                      ) : (
                        <View style={[styles.entryPhoto, styles.entryPhotoPlaceholder]}>
                          <Text style={styles.entryPlaceholderText}>🐶</Text>
                        </View>
                      )}
                      <Text style={styles.entryDogName} numberOfLines={1}>{entry.dog?.name}</Text>
                      <Text style={styles.entryVotes}>{entry.votes} votes</Text>
                      {comp.status === 'active' && entry.dog_id !== activeDog?.id && (
                        <TouchableOpacity
                          style={[styles.voteBtn, hasVoted && styles.voteBtnDisabled]}
                          onPress={() => handleVote(comp, entry)}
                          disabled={hasVoted}
                        >
                          <Text style={styles.voteBtnText}>{hasVoted ? '✓' : '❤️ Vote'}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </Card>
        );
      })}

      {competitions.length === 0 && (
        <Card>
          <Text style={styles.emptyText}>No active competitions right now.{'\n'}Check back soon! 🐾</Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  pageTitle: { fontSize: FontSize.xxxl, fontWeight: FontWeight.black, color: Colors.text },
  pageSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: -8 },
  compCard: { gap: Spacing.lg },
  compHeader: { gap: Spacing.sm },
  statusChip: { alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: 3, borderRadius: BorderRadius.full, marginBottom: 4 },
  statusActive: { backgroundColor: `${Colors.success}20` },
  statusUpcoming: { backgroundColor: `${Colors.info}20` },
  statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.black, color: Colors.success },
  compTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.text },
  compDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  compPrize: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary, marginTop: 4 },
  compDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  myEntryBanner: { backgroundColor: `${Colors.success}15`, padding: Spacing.md, borderRadius: BorderRadius.lg },
  myEntryText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.success },
  entriesSection: { gap: Spacing.md },
  entriesTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  entryCard: {
    width: 110, marginRight: Spacing.md,
    alignItems: 'center', gap: 4, position: 'relative',
  },
  entryRankBadge: { position: 'absolute', top: -6, right: -2, fontSize: 18, zIndex: 1 },
  entryPhoto: { width: 90, height: 90, borderRadius: 12 },
  entryPhotoPlaceholder: { backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  entryPlaceholderText: { fontSize: 36 },
  entryDogName: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.text },
  entryVotes: { fontSize: FontSize.xs, color: Colors.textSecondary },
  voteBtn: {
    paddingHorizontal: 12, paddingVertical: 4,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
  },
  voteBtnDisabled: { backgroundColor: Colors.surfaceAlt },
  voteBtnText: { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.bold },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
});
