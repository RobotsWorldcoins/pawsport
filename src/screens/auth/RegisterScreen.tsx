import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView,
  Platform, TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../../services/auth';
import supabase from '../../services/supabase';
import { useAppStore } from '../../store';
import Button from '../../components/common/Button';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { setUser, setAuthenticated } = useAppStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!fullName.trim()) return 'Please enter your name.';
    if (!email.includes('@')) return 'Invalid email address.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (password !== confirm) return 'Passwords do not match.';
    return null;
  };

  const handleRegister = async () => {
    const err = validate();
    if (err) { Alert.alert('Validation error', err); return; }

    setLoading(true);
    try {
      const data = await authService.signUp(email, password, fullName);
      if (data.user) {
        // Profile is created automatically via Supabase trigger
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();
        if (profile) setUser(profile as any);
        setAuthenticated(true);
        navigation.navigate('CreateDog' as never);
      }
    } catch (e: any) {
      Alert.alert('Registration failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#FFF5F0', '#FFFFFF']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.logo}>🐾</Text>
            <Text style={styles.title}>Join Pawsport</Text>
            <Text style={styles.subtitle}>Create your account & start exploring</Text>
          </View>

          <View style={styles.form}>
            {[
              { label: 'Full Name', value: fullName, setter: setFullName, placeholder: 'Your name', keyboard: 'default' as any, secure: false },
              { label: 'Email', value: email, setter: setEmail, placeholder: 'your@email.com', keyboard: 'email-address' as any, secure: false },
              { label: 'Password', value: password, setter: setPassword, placeholder: 'Min. 8 characters', keyboard: 'default' as any, secure: true },
              { label: 'Confirm Password', value: confirm, setter: setConfirm, placeholder: 'Repeat password', keyboard: 'default' as any, secure: true },
            ].map((field) => (
              <View key={field.label} style={styles.inputGroup}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  value={field.value}
                  onChangeText={field.setter}
                  placeholder={field.placeholder}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType={field.keyboard}
                  secureTextEntry={field.secure}
                  autoCapitalize={field.keyboard === 'email-address' ? 'none' : 'words'}
                />
              </View>
            ))}

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              size="lg"
              style={styles.btn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1 },
  scroll: { flexGrow: 1, padding: Spacing.xl + 4, paddingTop: Spacing.huge },
  backBtn: { marginBottom: Spacing.xl },
  backText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.medium },
  header: { alignItems: 'center', marginBottom: Spacing.xxxl },
  logo: { fontSize: 56, marginBottom: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.text },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.xs },
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
  btn: { marginTop: Spacing.sm },
});
