import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Button from '../../components/common/Button';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1', emoji: '🗺️',
    title: 'Discover Dog-Friendly Places',
    desc: 'Find parks, beaches, cafes, vets, and trails near you. Filtered, rated, and verified by the community.',
    bg: ['#FFF5F0', '#FFE8DF'] as [string, string],
  },
  {
    id: '2', emoji: '⭐',
    title: 'Level Up Your Dog',
    desc: 'Earn XP, unlock badges, reach new tiers from Puppy to Mythic Dog. Every adventure counts!',
    bg: ['#FFFBEB', '#FEF3C7'] as [string, string],
  },
  {
    id: '3', emoji: '⚔️',
    title: 'Compete in the Arena',
    desc: 'Enter Agility, Sprint, and Show arenas. Battle for the top spot and win exclusive badges.',
    bg: ['#F0FDF4', '#DCFCE7'] as [string, string],
  },
  {
    id: '4', emoji: '🏆',
    title: 'Join Competitions',
    desc: 'Monthly contests for cutest, funniest, most stylish dog. Community voting, real prizes.',
    bg: ['#EFF6FF', '#DBEAFE'] as [string, string],
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const [current, setCurrent] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const next = () => {
    if (current < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: current + 1 });
      setCurrent(current + 1);
    } else {
      navigation.navigate('Login' as never);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          setCurrent(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item }) => (
          <LinearGradient colors={item.bg} style={styles.slide}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.desc}</Text>
          </LinearGradient>
        )}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
          ))}
        </View>
        <Button
          title={current === SLIDES.length - 1 ? 'Get Started 🐾' : 'Next'}
          onPress={next}
          size="lg"
          style={styles.btn}
        />
        {current < SLIDES.length - 1 && (
          <Button
            title="Skip"
            onPress={() => navigation.navigate('Login' as never)}
            variant="ghost"
            size="sm"
            style={styles.skipBtn}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.huge,
    gap: Spacing.xl,
  },
  emoji: { fontSize: 100 },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.black,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 38,
  },
  desc: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  footer: {
    padding: Spacing.xxl,
    paddingBottom: Spacing.huge,
    gap: Spacing.lg,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  dots: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 8, height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.border,
  },
  dotActive: { width: 24, backgroundColor: Colors.primary },
  btn: { width: '100%' },
  skipBtn: {},
});
