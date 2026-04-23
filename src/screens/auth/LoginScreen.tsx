import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView,
  Platform, TouchableOpacity, Alert, ScrollView, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../../services/auth';
import supabase from '../../services/supabase';
import { useAppStore } from '../../store';
import Button from '../../components/common/Button';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';
import type { User } from '../../types';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { setUser, setAuthenticated, setActiveDog } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await authService.signIn(email, password);
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (profile) setUser(profile as User);

      const { data: dogs } = await supabase
        .from('dogs')
        .select('*')
        .eq('owner_id', profile?.id)
        .order('created_at', { ascending: true })
        .limit(1);

      if (dogs && dogs.length > 0) setActiveDog(dogs[0]);
      setAuthenticated(true);
    } catch (e: any) {
      Alert.alert('Login failed', e.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#FFF5F0', '#FFFFFF']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.logo}>🐾</Text>
            <Text style={styles.appName}>PAWSPORT</Text>
            <Text style={styles.tagline}>Your dog's passport to adventure</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Your password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={() => Alert.alert('Reset Password', 'A password reset link will be sent to your email.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Send', onPress: async () => { if (!email.trim()) { Alert.alert('Enter your email first'); return; } const { error } = await supabase.auth.resetPasswordForEmail(email.trim()); if (error) Alert.alert('Error', error.message); else Alert.alert('Done', 'Check your email for the reset link.'); } }])}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              size="lg"
              style={styles.loginBtn}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="Create Account"
              onPress={() => navigation.navigate('Register' as never)}
              variant="ghost"
              size="lg"
            />
          </View>

          <View style={styles.termsRow}>
            <Text style={styles.terms}>By continuing, you agree to our </Text>
            <TouchableOpacity onPress={() => navigation.navigate('TermsOfService' as never)}>
              <Text style={styles.termsLink}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.terms}> and </Text>
            <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy' as never)}>
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl + 4 },
  header: { alignItems: 'center', marginBottom: Spacing.huge },
  logo: { fontSize: 72, marginBottom: Spacing.sm },
  appName: {
    fontSize: FontSize.huge,
    fontWeight: FontWeight.black,
    color: Colors.primary,
    letterSpacing: 3,
  },
  tagline: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.xs },
  form: { gap: Spacing.lg },
  inputGroup: { gap: Spacing.xs },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: FontSize.md,
    color: Colors.text,
    ...Shadow.sm,
  },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  eyeBtn: { position: 'absolute', right: 14, top: 14 },
  eyeIcon: { fontSize: 18 },
  forgotText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    textAlign: 'right',
    fontWeight: FontWeight.medium,
  },
  loginBtn: { marginTop: Spacing.sm },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: FontSize.sm, color: Colors.textMuted },
  termsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xxxl,
  },
  terms: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  termsLink: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    lineHeight: 18,
    textDecorationLine: 'underline',
  },
});
