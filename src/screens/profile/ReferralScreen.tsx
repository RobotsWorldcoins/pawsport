import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Share,
  Alert, ScrollView, ActivityIndicator, Clipboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import supabase from '../../services/supabase';
import { awardXP } from '../../services/xp';
import { useAppStore } from '../../store';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';

const XP_REFERRAL_INVITER = 100;
const XP_REFERRAL_INVITED = 50;

function generateReferralCode(userId: string): string {
  // Deterministic 6-char code from user ID
  return userId.replace(/-/g, '').slice(0, 6).toUpperCase();
}

export default function ReferralScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, activeDog, subscriptionTier } = useAppStore();
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [totalXPEarned, setTotalXPEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [inputCode, setInputCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [alreadyReferred, setAlreadyReferred] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const code = generateReferralCode(user.id);
      setReferralCode(code);
      loadReferralStats(code);
    }
  }, [user]);

  const loadReferralStats = async (code: string) => {
    setLoading(true);
    try {
      // Count how many used this user's referral code
      const { data: referrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_code', code);

      if (referrals) {
        setReferralCount(referrals.length);
        setTotalXPEarned(referrals.length * XP_REFERRAL_INVITER);
      }

      // Check if this user was already referred by someone
      const { data: myReferral } = await supabase
        .from('referrals')
        .select('*')
        .eq('referred_user_id', user?.id)
        .maybeSingle();

      setAlreadyReferred(!!myReferral);
    } catch {
      // referrals table may not exist yet — graceful fallback
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🐾 Join me on Pawsport — the best app for dog owners in Europe!\n\nUse my referral code ${referralCode} when signing up and we both get bonus XP!\n\nDownload: https://pawsport.app`,
        title: 'Join Pawsport with my referral code!',
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = () => {
    Clipboard.setString(referralCode);
    Alert.alert('Copied!', `Referral code ${referralCode} copied to clipboard.`);
  };

  const handleRedeemCode = async () => {
    if (!inputCode.trim() || !user || !activeDog) return;
    const code = inputCode.trim().toUpperCase();

    if (code === referralCode) {
      Alert.alert('Nice try! 😄', "You can't use your own referral code.");
      return;
    }

    if (alreadyReferred) {
      Alert.alert('Already redeemed', 'You have already used a referral code.');
      return;
    }

    setRedeeming(true);
    try {
      // Find the referrer
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .limit(100);

      if (!users) throw new Error('Could not find referrer');

      // Find which user has this referral code
      const referrer = users.find((u: any) => generateReferralCode(u.id) === code);
      if (!referrer) {
        Alert.alert('Invalid code', 'This referral code does not exist. Check and try again.');
        return;
      }

      // Record the referral
      const { error } = await supabase.from('referrals').insert({
        referrer_code: code,
        referrer_user_id: referrer.id,
        referred_user_id: user.id,
        referred_dog_id: activeDog.id,
      });

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Already used', 'This referral has already been redeemed.');
        } else {
          throw error;
        }
        return;
      }

      // Award XP to both users
      await awardXP(activeDog.id, 'badge_unlock' as any, undefined, subscriptionTier, activeDog.streak_days);

      // Find referrer's dog to award them XP too
      const { data: referrerDog } = await supabase
        .from('dogs')
        .select('id, streak_days')
        .eq('owner_id', referrer.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (referrerDog) {
        await awardXP(referrerDog.id, 'badge_unlock' as any, undefined, 'free', referrerDog.streak_days || 0);
      }

      setAlreadyReferred(true);
      Alert.alert(
        '🎉 Referral Applied!',
        `You earned +${XP_REFERRAL_INVITED} XP and your friend earned +${XP_REFERRAL_INVITER} XP!\n\nWelcome to the Pawsport family! 🐾`,
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not redeem referral code.');
    } finally {
      setRedeeming(false);
    }
  };

  if (!user) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🐾 Refer Friends</Text>
        <Text style={styles.subtitle}>Earn XP for every friend who joins!</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.hero}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Text style={styles.heroEmoji}>🏆</Text>
          <Text style={styles.heroTitle}>Invite Friends, Earn XP</Text>
          <View style={styles.heroRewards}>
            <View style={styles.heroRewardItem}>
              <Text style={styles.heroRewardXP}>+{XP_REFERRAL_INVITER} XP</Text>
              <Text style={styles.heroRewardLabel}>You earn</Text>
            </View>
            <Text style={styles.heroRewardDivider}>per friend</Text>
            <View style={styles.heroRewardItem}>
              <Text style={styles.heroRewardXP}>+{XP_REFERRAL_INVITED} XP</Text>
              <Text style={styles.heroRewardLabel}>Friend earns</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Your Code */}
        <Card style={styles.codeCard}>
          <Text style={styles.cardLabel}>YOUR REFERRAL CODE</Text>
          <TouchableOpacity style={styles.codeBox} onPress={handleCopy} activeOpacity={0.7}>
            <Text style={styles.codeText}>{referralCode}</Text>
            <Text style={styles.copyHint}>Tap to copy 📋</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.md }} />
          ) : (
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{referralCount}</Text>
                <Text style={styles.statLabel}>Friends joined</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{totalXPEarned}</Text>
                <Text style={styles.statLabel}>XP earned</Text>
              </View>
            </View>
          )}

          <Button
            title="📤 Share Referral Link"
            onPress={handleShare}
            size="lg"
            style={{ marginTop: Spacing.md }}
          />
        </Card>

        {/* Redeem a code */}
        {!alreadyReferred ? (
          <Card style={styles.redeemCard}>
            <Text style={styles.cardLabel}>HAVE A REFERRAL CODE?</Text>
            <Text style={styles.redeemDesc}>
              Enter a friend's code to earn +{XP_REFERRAL_INVITED} XP bonus for both of you!
            </Text>
            <View style={styles.inputRow}>
              <View style={styles.inputWrap}>
                <Text
                  style={styles.codeInput}
                  onPress={() => {
                    Alert.prompt?.(
                      'Enter Referral Code',
                      "Enter your friend's 6-character code",
                      (text) => setInputCode(text?.toUpperCase() || ''),
                      'plain-text',
                      inputCode,
                    );
                  }}
                >
                  {inputCode || 'Enter code...'}
                </Text>
              </View>
              <Button
                title="Apply"
                onPress={handleRedeemCode}
                loading={redeeming}
                disabled={!inputCode.trim()}
                size="sm"
                style={styles.applyBtn}
              />
            </View>
          </Card>
        ) : (
          <Card style={styles.redeemCard}>
            <View style={styles.redeemedBadge}>
              <Text style={styles.redeemedIcon}>✅</Text>
              <Text style={styles.redeemedText}>You already redeemed a referral code!</Text>
            </View>
          </Card>
        )}

        {/* How it works */}
        <Card style={styles.howCard}>
          <Text style={styles.cardLabel}>HOW IT WORKS</Text>
          {[
            { step: '1', text: `Share your code ${referralCode} with a friend` },
            { step: '2', text: 'Friend signs up and enters your code' },
            { step: '3', text: `You both earn XP — you get +${XP_REFERRAL_INVITER}, they get +${XP_REFERRAL_INVITED}` },
            { step: '4', text: 'No limit — invite as many friends as you like!' },
          ].map((item) => (
            <View key={item.step} style={styles.step}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{item.step}</Text>
              </View>
              <Text style={styles.stepText}>{item.text}</Text>
            </View>
          ))}
        </Card>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { marginBottom: Spacing.xs },
  backText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.medium },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.text },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 80 },

  hero: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.colored(Colors.primary),
  },
  heroEmoji: { fontSize: 48 },
  heroTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: '#fff' },
  heroRewards: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginTop: Spacing.sm },
  heroRewardItem: { alignItems: 'center', gap: 4 },
  heroRewardXP: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: '#fff' },
  heroRewardLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)' },
  heroRewardDivider: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.6)' },

  codeCard: { gap: Spacing.md },
  cardLabel: {
    fontSize: FontSize.xs, fontWeight: FontWeight.black,
    color: Colors.textMuted, letterSpacing: 1.5,
  },
  codeBox: {
    backgroundColor: `${Colors.primary}12`,
    borderWidth: 2,
    borderColor: `${Colors.primary}40`,
    borderRadius: BorderRadius.xl,
    borderStyle: 'dashed',
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    gap: 6,
  },
  codeText: {
    fontSize: 36,
    fontWeight: FontWeight.black,
    color: Colors.primary,
    letterSpacing: 8,
  },
  copyHint: { fontSize: FontSize.xs, color: Colors.textMuted },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.border },
  statNumber: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.text },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted },

  redeemCard: { gap: Spacing.md },
  redeemDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  inputRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  inputWrap: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
  },
  codeInput: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: 3,
  },
  applyBtn: { flexShrink: 0 },
  redeemedBadge: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  redeemedIcon: { fontSize: 28 },
  redeemedText: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.medium, flex: 1 },

  howCard: { gap: Spacing.md },
  step: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  stepNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepNumText: { color: '#fff', fontWeight: FontWeight.black, fontSize: FontSize.sm },
  stepText: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1, lineHeight: 20, paddingTop: 4 },
});
