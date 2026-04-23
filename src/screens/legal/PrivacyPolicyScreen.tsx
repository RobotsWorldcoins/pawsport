import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, FontSize, FontWeight, Spacing } from '../../theme';

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.updated}>Last updated: April 2026</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Section title="1. Introduction">
          Pawsport ("we", "us", "our") is committed to protecting your personal data. This Privacy Policy explains how we collect, use, and protect information when you use the Pawsport app ("App"). This policy complies with the EU General Data Protection Regulation (GDPR) and Portuguese data protection law.
        </Section>

        <Section title="2. Data Controller">
          {`Pawsport\nEmail: privacy@pawsport.app\nWebsite: https://pawsport.app\n\nYou may contact our Data Protection Officer at the above email for any privacy-related enquiries.`}
        </Section>

        <Section title="3. Data We Collect">
          {`Account Data: name, email address, password (hashed), profile photo.\n\nDog Profile Data: dog name, breed, age, weight, city, personality tags, photos.\n\nLocation Data: GPS coordinates used only at the moment of check-in to verify your proximity to a dog-friendly location. We do not continuously track your location.\n\nUsage Data: XP activity, check-ins, badges earned, arena results, social posts, likes, competition entries.\n\nPayment Data: We do not store card details. Payments are processed by Stripe, which is PCI DSS compliant. We receive only a subscription status confirmation.\n\nDevice Data: device type, OS version, and crash logs for debugging purposes.`}
        </Section>

        <Section title="4. How We Use Your Data">
          {`• To provide and improve the App's core features\n• To manage your account and subscriptions\n• To calculate XP, streaks, levels, and rankings\n• To show you nearby dog-friendly places\n• To send you important notifications about your account\n• To detect and prevent fraud or abuse\n• To comply with legal obligations`}
        </Section>

        <Section title="5. Legal Basis for Processing (GDPR)">
          {`• Contract performance: processing necessary to deliver the App's services you signed up for.\n• Legitimate interests: analytics, security, preventing fraud.\n• Consent: location access, marketing communications (you can withdraw at any time).\n• Legal obligation: compliance with applicable laws.`}
        </Section>

        <Section title="6. Data Sharing">
          {`We do not sell your personal data. We share data only with:\n\n• Supabase (database & authentication hosting, EU data centres)\n• Stripe (payment processing)\n• Google (Maps & Places API — only location queries, no personal data)\n• Expo / EAS (app distribution)\n\nAll third-party processors are bound by data processing agreements and GDPR-compliant terms.`}
        </Section>

        <Section title="7. Location Data">
          Location access is required to verify check-ins and show nearby places. You can disable location access in your device settings at any time. Check-in XP will not be available without location access. We never share your precise location with other users — only the places you check into (which you can choose to post publicly).
        </Section>

        <Section title="8. Data Retention">
          {`• Account data: retained while your account is active + 30 days after deletion request.\n• Check-in and XP history: retained for the lifetime of your account for leaderboard purposes.\n• Payment records: retained for 7 years as required by tax law.\n• Crash logs: deleted after 90 days.`}
        </Section>

        <Section title="9. Your Rights (GDPR)">
          {`As an EU resident you have the right to:\n\n• Access: request a copy of your personal data\n• Rectification: correct inaccurate data\n• Erasure: request deletion of your account and data\n• Portability: receive your data in a machine-readable format\n• Objection: object to certain types of processing\n• Restriction: request we limit how we use your data\n• Withdraw consent at any time\n\nTo exercise any right, email: privacy@pawsport.app\nWe will respond within 30 days.`}
        </Section>

        <Section title="10. Children's Privacy">
          Pawsport is not intended for users under 18. We do not knowingly collect data from children. If you believe a child has provided us data, please contact us immediately.
        </Section>

        <Section title="11. Security">
          We implement industry-standard security measures including encrypted data transmission (TLS), hashed passwords, and access controls. However, no method of transmission over the internet is 100% secure.
        </Section>

        <Section title="12. Cookies & Analytics">
          The mobile app does not use browser cookies. We use anonymous crash analytics via Expo to improve app stability. No advertising trackers are used.
        </Section>

        <Section title="13. Changes to This Policy">
          We may update this policy. We will notify you of significant changes via in-app notification or email at least 30 days before they take effect.
        </Section>

        <Section title="14. Complaints">
          {`If you believe we have not handled your data correctly, you have the right to lodge a complaint with the Portuguese data protection authority:\n\nCNPD — Comissão Nacional de Proteção de Dados\nwww.cnpd.pt\nTel: +351 213 928 400`}
        </Section>

        <Section title="15. Contact">
          {`Privacy enquiries: privacy@pawsport.app\nGeneral support: support@pawsport.app\nWebsite: https://pawsport.app`}
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
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  sectionBody: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22 },
  footer: {
    marginTop: Spacing.xxl,
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  footerText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
