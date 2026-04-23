import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import supabase from '../../services/supabase';
import { useAppStore } from '../../store';
import Button from '../../components/common/Button';
import { PERSONALITY_TAGS, CITIES } from '../../constants';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';

export default function CreateDogScreen() {
  const navigation = useNavigation<any>();
  const { user, setActiveDog } = useAppStore();
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [ageMonths, setAgeMonths] = useState('');
  const [weight, setWeight] = useState('');
  const [city, setCity] = useState('lisbon');
  const [tags, setTags] = useState<string[]>([]);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag].slice(0, 5)
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const handleCreate = async () => {
    if (!name.trim() || !breed.trim()) {
      Alert.alert('Missing fields', 'Please enter your dog\'s name and breed.');
      return;
    }
    setLoading(true);
    try {
      let avatarUrl: string | undefined;

      if (avatarUri) {
        const ext = avatarUri.split('.').pop();
        const fileName = `${user?.id}/dog-${Date.now()}.${ext}`;
        const response = await fetch(avatarUri);
        const blob = await response.blob();
        const { error: uploadError } = await supabase.storage
          .from('dog-avatars')
          .upload(fileName, blob, { contentType: `image/${ext}` });
        if (!uploadError) {
          const { data } = supabase.storage.from('dog-avatars').getPublicUrl(fileName);
          avatarUrl = data.publicUrl;
        }
      }

      const { data: dog, error } = await supabase
        .from('dogs')
        .insert({
          owner_id: user?.id,
          name: name.trim(),
          breed: breed.trim(),
          age_months: parseInt(ageMonths) || 12,
          weight_kg: parseFloat(weight) || 0,
          city,
          personality_tags: tags,
          avatar_url: avatarUrl,
          xp: 0,
          level: 1,
          tier: 'Puppy',
          streak_days: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial dog stats
      await supabase.from('dog_stats').insert({
        dog_id: dog.id,
        hp: 50, power: 50, defense: 50, agility: 50,
        speed: 50, instinct: 50, focus: 50, charm: 50,
        stat_points_available: 0,
      });

      setActiveDog(dog);
      navigation.navigate('Main' as never);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#FFF5F0', '#FFFFFF']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>🐶 Meet Your Dog</Text>
        <Text style={styles.subtitle}>Let's create your dog's Pawsport profile</Text>

        <TouchableOpacity onPress={pickImage} style={styles.avatarWrap}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>🐾{'\n'}Add Photo</Text>
            </LinearGradient>
          )}
          <View style={styles.avatarEdit}><Text>✏️</Text></View>
        </TouchableOpacity>

        <View style={styles.form}>
          {[
            { label: "Dog's Name *", value: name, setter: setName, placeholder: 'e.g. Luna' },
            { label: 'Breed *', value: breed, setter: setBreed, placeholder: 'e.g. Golden Retriever' },
            { label: 'Age (months)', value: ageMonths, setter: setAgeMonths, placeholder: 'e.g. 24', numeric: true },
            { label: 'Weight (kg)', value: weight, setter: setWeight, placeholder: 'e.g. 15.5', numeric: true },
          ].map((f) => (
            <View key={f.label} style={styles.inputGroup}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                style={styles.input}
                value={f.value}
                onChangeText={f.setter}
                placeholder={f.placeholder}
                placeholderTextColor={Colors.textMuted}
                keyboardType={f.numeric ? 'numeric' : 'default'}
              />
            </View>
          ))}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>City</Text>
            <View style={styles.cityRow}>
              {Object.entries(CITIES).map(([key, val]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.cityBtn, city === key && styles.cityBtnActive]}
                  onPress={() => setCity(key)}
                >
                  <Text style={[styles.cityText, city === key && styles.cityTextActive]}>
                    {val.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Personality Tags (max 5)</Text>
            <View style={styles.tagsWrap}>
              {PERSONALITY_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tag, tags.includes(tag) && styles.tagActive]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[styles.tagText, tags.includes(tag) && styles.tagTextActive]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button
            title="Create My Dog's Pawsport 🐾"
            onPress={handleCreate}
            loading={loading}
            size="lg"
            style={styles.btn}
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.xl + 4, paddingTop: Spacing.huge },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.black, color: Colors.text, textAlign: 'center' },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs, marginBottom: Spacing.xxl },
  avatarWrap: { alignSelf: 'center', marginBottom: Spacing.xxl, position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: Colors.primary },
  avatarPlaceholder: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarPlaceholderText: { color: '#fff', fontSize: FontSize.sm, textAlign: 'center', fontWeight: FontWeight.semibold },
  avatarEdit: {
    position: 'absolute', bottom: 4, right: 4,
    backgroundColor: '#fff', borderRadius: 12, padding: 4,
    ...Shadow.sm,
  },
  form: { gap: Spacing.lg },
  inputGroup: { gap: Spacing.xs },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: FontSize.md, color: Colors.text,
    ...Shadow.sm,
  },
  cityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cityBtn: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  cityBtnActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}15` },
  cityText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  cityTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  tagActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}15` },
  tagText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  tagTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  btn: { marginTop: Spacing.md },
});
