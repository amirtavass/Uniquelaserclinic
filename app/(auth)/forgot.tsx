// app/(auth)/forgot.tsx — honest path: email reset + “we’ll call you” fallback (no invented SLA).
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, View } from 'react-native';

import * as auth from '../../lib/auth';
import { CLINIC } from '../../lib/content';
import { useTheme } from '../../theme/ThemeContext';
import { AppText, Button, Field, Screen, ScreenHeader } from '../../components/ui';

export default function Forgot() {
  const router = useRouter();
  const { spacing } = useTheme();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <Screen canvas="pearl" keyboard>
      <ScreenHeader title="Forgot details" onBack={() => router.back()} />
      <View style={{ padding: spacing.xxl, gap: spacing.md }}>
        <AppText role="body" tone="soft">We’ll email a secure link to reset your password.</AppText>
        {sent ? (
          <>
            <AppText role="bodyMedium" tone="success">✓ Reset link sent to {email}</AppText>
            <Button title="Back to sign in" variant="secondary" onPress={() => router.replace('/me')} full />
          </>
        ) : (
          <>
            <Field label="Email" value={email} onChange={setEmail} keyboardType="email-address" />
            <Button title="Send reset link" disabled={!email} full
              onPress={async () => { const r = await auth.requestPasswordReset(email); if (!r.error) setSent(true); }} />
          </>
        )}
        <Button variant="quiet" title={`Easier by phone? Call ${CLINIC.phoneDisplay}`}
          onPress={() => void Linking.openURL(`tel:${CLINIC.phoneTel}`)} />
      </View>
    </Screen>
  );
}
