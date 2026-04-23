import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../theme';

export default function TermsOfServiceScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.updated}>Last updated: April 2026</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Section title="1. Acceptance of Terms">
          By downloading, installing or using Pawsport ("the App"), you agree to be bound by these Terms of Service. If you do not agree, do not use the App.
        </Section>

        <Section title="2. About Pawsport">
          Pawsport is a dog lifestyle application that allows dog owners to discover dog-friendly locations, earn virtual XP points, participate in community competitions, and connect with other dog owners across Europe. The App is operated by Pawsport (the "Company").
        </Section>

        <Section title="3. Eligibility">
          You must be at least 18 years old to create an account. By using the App, you confirm that all information you provide is accurate and that you have the legal authority to agree to these terms.
        </Section>

        <Section title="4. User Accounts">
          You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorised use of your account. We reserve the right to terminate accounts that violate these terms.
        </Section>

        <Section title="5. XP Points, Badges & Rankings">
          XP points, badges, levels, tiers and rankings within Pawsport are virtual rewards only. They have no monetary value and cannot be exchanged, transferred or redeemed for cash or real-world prizes unless explicitly stated in a specific promotion with separate rules. The Company reserves the right to modify, reset or remove any virtual reward at any time.
        </Section>

        <Section title="6. GPS & Location Data">
          Pawsport uses your device's GPS to award XP for check-ins at dog-friendly locations. Location data is processed on your device and used only to verify proximity to places. We do not continuously track or store your precise location without your explicit consent. You can disable location access in your device settings at any time, though this will limit check-in functionality.
        </Section>

        <Section title="7. Premium Subscriptions">
          Pawsport offers premium subscription tiers (Premium at €9.99/month and Premium Pro at €19.99/month) that provide additional features including XP multipliers, profile frames, and advanced tools. Subscriptions are billed monthly. You may cancel at any time; cancellation takes effect at the end of the current billing period. Refunds are subject to applicable EU consumer protection laws. Subscription benefits are non-transferable.
        </Section>

        <Section title="8. User Content">
          You retain ownership of content you post (photos, text, etc.). By posting content, you grant Pawsport a non-exclusive, worldwide, royalty-free licence to display and distribute that content within the App. You agree not to post content that is illegal, harmful, abusive, or violates third-party rights. We reserve the right to remove any content at our discretion.
        </Section>

        <Section title="9. Dog Safety & Responsibility">
          You are solely responsible for your dog's behaviour and safety. Pawsport does not verify the safety or suitability of listed locations. Always follow local laws regarding dogs, including leash requirements. Check conditions before visiting any location.
        </Section>

        <Section title="10. Community Guidelines">
          {`Be respectful to other users and their dogs.\nDo not post false reviews or misleading information.\nDo not use the App to harass, bully or harm others.\nDo not impersonate other users or businesses.\nReport any content that violates these guidelines.`}
        </Section>

        <Section title="11. Intellectual Property">
          All App content, design, logos, and features are the intellectual property of Pawsport. You may not copy, modify, distribute or create derivative works without express written permission.
        </Section>

        <Section title="12. Limitation of Liability">
          To the maximum extent permitted by law, Pawsport is not liable for any indirect, incidental, or consequential damages arising from your use of the App. Our total liability shall not exceed the amount you paid for the subscription in the 12 months preceding the claim.
        </Section>

        <Section title="13. Changes to Terms">
          We may update these terms at any time. We will notify you of significant changes via the App or email. Continued use after changes constitutes acceptance.
        </Section>

        <Section title="14. Governing Law">
          These terms are governed by the laws of Portugal. Any disputes shall be subject to the jurisdiction of Portuguese courts, without prejudice to your rights as a consumer under EU law.
        </Section>

        <Section title="15. Contact">
          {`For questions about these terms:\nEmail: support@pawsport.app\nWebsite: https://pawsport.app`}
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>🐾 Pawsport — Your dog's passport to adventure</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { marginBottom: Spacing.xs },
  backText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.medium },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.text },
  updated: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  scroll: { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: 60, gap: Spacing.lg },
  section: { gap: Spacing.sm },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  sectionBody: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  footer: {
    marginTop: Spacing.xxl,
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  footerText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
