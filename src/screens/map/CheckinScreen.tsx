import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Image, Alert,
  TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import supabase from '../../services/supabase';
import { awardXP } from '../../services/xp';
import { useAppStore } from '../../store';
import { XP_REWARDS } from '../../constants';
import Button from '../../components/common/Button';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';

export default function CheckinScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { location } = route.params;
  const { activeDog, subscriptionTier } = useAppStore();
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const xpSource = (location.category as keyof typeof XP_REWARDS) || 'park';
  const baseXP = XP_REWARDS[xpSource] || XP_REWARDS.park;

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.8,
    });
    if (!res.canceled) setPhotoUri(res.assets[0].uri);
  };

  const handleCheckin = async () => {
    if (!activeDog) return;
    setLoading(true);
    try {
      let photoUrl: string | undefined;
      if (photoUri) {
        const ext = photoUri.split('.').pop();
        const path = `checkins/${activeDog.id}/${Date.now()}.${ext}`;
        const res = await fetch(photoUri);
        const blob = await res.blob();
        await supabase.storage.from('checkin-photos').upload(path, blob);
        const { data } = supabase.storage.from('checkin-photos').getPublicUrl(path);
        photoUrl = data.publicUrl;
      }

      const { error } = await supabase.from('checkins').insert({
        dog_id: activeDog.id,
        location_id: location.id,
        xp_earned: baseXP,
        photo_url: photoUrl,
        note: note.trim() || null,
      });
      if (error) throw error;

      const result = await awardXP(
        activeDog.id,
        xpSource as any,
        location.id,
        subscriptionTier,
        activeDog.streak_days
      );

      // Update streak
      const today = new Date().toISOString().split('T')[0];
      if (activeDog.last_checkin !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const newStreak = activeDog.last_checkin === yesterday
          ? (activeDog.streak_days || 0) + 1
          : 1;
        await supabase.from('dogs').update({
          last_checkin: today,
          streak_days: newStreak,
        }).eq('id', activeDog.id);
      }

      Alert.alert(
        '🐾 Check-in Complete!',
        `${activeDog.name} earned +${result.totalXP} XP (${result.multiplier}x multiplier)${result.leveledUp ? `\n🎉 Level Up! Now Level ${result.newLevel}!` : ''}`,
        [{ text: 'Awesome!', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.locationHeader}>
          <Text style={styles.locationEmoji}>{getEmoji(location.category)}</Text>
          <Text style={styles.locationName}>{location.name}</Text>
          <Text style={styles.locationAddress}>{location.address}</Text>
        </View>

        <LinearGradient
          colors={[`${Colors.primary}15`, `${Colors.primary}05`]}
          style={styles.xpPreview}
        >
          <Text style={styles.xpPreviewLabel}>You'll earn approximately</Text>
          <Text style={styles.xpPreviewValue}>+{baseXP} XP</Text>
          <Text style={styles.xpPreviewNote}>
            (×{getMultiplierLabel(subscriptionTier, activeDog?.streak_days || 0)} multiplier applies)
          </Text>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.label}>Add a Note (optional)</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="How was it? Any tips for other dogs?"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoBtnInner}>
              <Text style={styles.photoBtnEmoji}>📸</Text>
              <Text style={styles.photoBtnText}>Add a Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <Button
          title="🐾 Check In Here!"
          onPress={handleCheckin}
          loading={loading}
          size="lg"
          style={styles.checkinBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function getEmoji(cat: string) {
  const map: Record<string, string> = { dog_park: '🌳', beach: '🏖️', trail: '🥾', veterinarian: '🏥', trainer: '🎓', grooming: '✂️', cafe: '☕', hotel: '🏨', event: '🎉' };
  return map[cat] || '📍';
}

function getMultiplierLabel(tier: string, streak: number) {
  let m = 1;
  if (streak >= 365) m *= 3;
  else if (streak >= 30) m *= 2;
  else if (streak >= 7) m *= 1.5;
  if (tier === 'premium_pro') m *= 3;
  else if (tier === 'premium') m *= 2;
  return m;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingTop: Spacing.huge, gap: Spacing.lg },
  backBtn: { marginBottom: Spacing.sm },
  backText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.medium },
  locationHeader: { alignItems: 'center', gap: 6 },
  locationEmoji: { fontSize: 56 },
  locationName: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.text, textAlign: 'center' },
  locationAddress: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  xpPreview: {
    borderRadius: BorderRadius.xl, padding: Spacing.xl,
    alignItems: 'center', gap: 4,
  },
  xpPreviewLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  xpPreviewValue: { fontSize: FontSize.huge, fontWeight: FontWeight.black, color: Colors.primary },
  xpPreviewNote: { fontSize: FontSize.xs, color: Colors.textSecondary },
  section: { gap: Spacing.sm },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  noteInput: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.lg, padding: Spacing.lg,
    fontSize: FontSize.md, color: Colors.text, minHeight: 80, textAlignVertical: 'top',
    ...Shadow.sm,
  },
  photoBtn: {
    borderRadius: BorderRadius.xl, overflow: 'hidden',
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    height: 160,
  },
  photo: { width: '100%', height: '100%' },
  photoBtnInner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  photoBtnEmoji: { fontSize: 36 },
  photoBtnText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  checkinBtn: { marginTop: Spacing.sm },
});
