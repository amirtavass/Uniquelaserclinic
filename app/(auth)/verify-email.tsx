// app/(auth)/verify-email.tsx — interstitial after sign-up when confirmation is required (S01).
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import * as auth from '../../lib/auth';
import { useTheme } from '../../theme/ThemeContext';
import { AppText, Button, Screen, ScreenHeader } from '../../components/ui';
import { CLINIC } from '../../lib/content';

export default function VerifyEmail() {
  const router = useRouter();
  const { spacing } = useTheme();
  const [sent, setSent] = useState<string | null>(null);
  return (
    <Screen canvas="pearl">
      <ScreenHeader title="Check your email" onBack={() => router.back()} />
      <View style={{ padding: spacing.xxl, gap: spacing.md }}>
        <AppText role="h3">We’ve sent a confirmation link</AppText>
        <AppText role="body" tone="soft">
          Open it on this phone, then sign in. Until then you can still browse everything — the
          account just can’t book yet.
        </AppText>
        {sent ? <AppText role="small" tone="success">✓ {sent}</AppText> : null}
        <Button variant="ghost" title="Resend email" onPress={async () => { const r = await auth.resendVerification(); setSent(r.error ? null : 'Sent again.'); }} />
        <Button title="I’ve confirmed — sign in" variant="secondary" onPress={() => router.replace('/me')} />
        <AppText role="small" tone="soft">Or call {CLINIC.phoneDisplay} and we’ll sort it.</AppText>
      </View>
    </Screen>
  );
}
