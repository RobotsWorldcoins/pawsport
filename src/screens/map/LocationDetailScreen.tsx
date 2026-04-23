import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import supabase from '../../services/supabase';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';
import type { Checkin } from '../../types';

export default function LocationDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { location } = route.params;
  const [checkins, setCheckins] = useState<Checkin[]>([]);

  useEffect(() => {
    supabase.from('checkins').select('*, dog:dogs(name,avatar_url)').eq('location_id', location.id).order('created_at', { ascending: false }).limit(10).then(({ data }) => {
      if (data) setCheckins(data as any);
    });
  }, [location.id]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.emoji}>{getEmoji(location.category)}</Text>
        <Text style={styles.name}>{location.name}</Text>
        <Text style={styles.address}>{location.address}</Text>
        <View style={styles.meta}>
          {location.rating && <View style={styles.chip}><Text style={styles.chipText}>⭐ {location.rating}</Text></View>}
          <View style={styles.chip}><Text style={styles.chipText}>🐾 {location.checkin_count} check-ins</Text></View>
          {location.is_verified && <View style={[styles.chip, styles.verifiedChip]}><Text style={[styles.chipText, styles.verifiedText]}>✓ Verified</Text></View>}
        </View>
      </View>
      {location.filter_tags?.length > 0 && (
        <View style={styles.tagsSection}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.tags}>
            {location.filter_tags.map((tag: string) => (
              <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
            ))}
          </View>
        </View>
      )}
      <TouchableOpacity
        style={styles.checkinBtn}
        onPress={() => navigation.navigate('Checkin', { location })}
      >
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.checkinBtnGradient}>
          <Text style={styles.checkinBtnText}>🐾 Check In Here</Text>
        </LinearGradient>
      </TouchableOpacity>
      {checkins.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Visitors</Text>
          {checkins.map((ci: any) => (
            <View key={ci.id} style={styles.checkinRow}>
              {ci.dog?.avatar_url ? (
                <Image source={{ uri: ci.dog.avatar_url }} style={styles.ciAvatar} />
              ) : (
                <View style={[styles.ciAvatar, styles.ciAvatarPlaceholder]}><Text>🐶</Text></View>
              )}
              <View>
                <Text style={styles.ciDogName}>{ci.dog?.name}</Text>
                <Text style={styles.ciDate}>{new Date(ci.created_at).toLocaleDateString()}</Text>
                {ci.note && <Text style={styles.ciNote}>{ci.note}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
function getEmoji(cat: string) {
  const m: Record<string,string> = { dog_park:'🌳',beach:'🏖️',trail:'🥾',veterinarian:'🏥',trainer:'🎓',grooming:'✂️',cafe:'☕',hotel:'🏨',event:'🎉' };
  return m[cat] || '📍';
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingTop: Spacing.huge, gap: Spacing.xl, paddingBottom: 60 },
  backBtn: {},
  backText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.medium },
  header: { alignItems: 'center', gap: Spacing.sm },
  emoji: { fontSize: 64 },
  name: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.text, textAlign: 'center' },
  address: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: 4, backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.full },
  chipText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  verifiedChip: { backgroundColor: `${Colors.accent}15` },
  verifiedText: { color: Colors.accent, fontWeight: FontWeight.bold },
  tagsSection: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: Spacing.md, paddingVertical: 4, backgroundColor: `${Colors.primary}15`, borderRadius: BorderRadius.full },
  tagText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.medium },
  checkinBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadow.colored(Colors.primary) },
  checkinBtnGradient: { padding: Spacing.xl, alignItems: 'center' },
  checkinBtnText: { color: '#fff', fontWeight: FontWeight.black, fontSize: FontSize.xl },
  section: { gap: Spacing.md },
  checkinRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  ciAvatar: { width: 40, height: 40, borderRadius: 20 },
  ciAvatarPlaceholder: { backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  ciDogName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  ciDate: { fontSize: FontSize.xs, color: Colors.textSecondary },
  ciNote: { fontSize: FontSize.sm, color: Colors.textSecondary, fontStyle: 'italic', marginTop: 2 },
});
