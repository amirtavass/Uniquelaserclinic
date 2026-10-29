// app/(consumer)/deletion.tsx — GDPR deletion REQUEST (08/02, DA-17/ADR-005). Honest pipeline copy.
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import * as db from '../../lib/db';
import { COPY } from '../../lib/content';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../theme/ThemeContext';
import { AppText, Button, Card, EmptyState, ErrorRetry, Screen, ScreenHeader } from '../../components/ui';
import { ConfirmSheet } from '../../components/Sheets';

export default function Deletion() {
  const router = useRouter();
  const { user } = useAuth();
  const { spacing, colors } = useTheme();
  const [pending, setPending] = useState<any | null>(null);
  const [sheet, setSheet] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const r = await db.deletionQueueOwn();
    setPending(r.data ?? null);
  };
  useEffect(() => { void load(); }, []);

  const send = async () => {
    setBusy(true); setErr(null);
    const r = await db.requestDeletion();
    setBusy(false); setSheet(false);
    if (r.error) setErr(r.error); else void load();
  };

  return (
    <Screen canvas="pearl" scroll
      footer={pending ? undefined : (
        <Button variant="dangerText" title="Request deletion" full onPress={() => setSheet(true)} />
      )}>
      <ScreenHeader title="Request data deletion" onBack={() => router.back()} />
      {err ? <ErrorRetry message={err} onRetry={() => undefined} /> : null}
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        {pending ? (
          <Card>
            <AppText role="h3">Request {pending.status === 'REQUESTED' ? 'received' : 'in review'}</AppText>
            <AppText role="small" tone="soft" style={{ marginTop: 6 }}>
              The owner reviews requests personally. We’ll tell you here when it’s done.
            </AppText>
          </Card>
        ) : (
          <>
            <AppText role="body" tone="soft">You can ask us to remove your account and details.</AppText>
            <Card>
              <AppText role="bodyMedium" style={{ marginBottom: 6 }}>What this means</AppText>
              {[
                'Your name & mobile are removed',
                'Appointment history is kept in a form that can’t identify you, where the law lets us keep records',
                'Push tokens and reminders are deleted',
                'Marketing stops',
                'Consent records stay as proof of your choices',
              ].map(l => (
                <View key={l} style={{ flexDirection: 'row', gap: 8, marginVertical: 4 }}>
                  <AppText style={{ color: colors.gold1 }}>•</AppText>
                  <AppText role="small" tone="soft" style={{ flex: 1 }}>{l}</AppText>
                </View>
              ))}
              <AppText role="caption" tone="soft" style={{ marginTop: 8 }}>This can’t be undone.</AppText>
            </Card>
            <Card>
              <AppText role="bodyMedium">Want to check or export something first?</AppText>
              <AppText role="small" tone="soft">Ask us — it’s your data.</AppText>
              <View style={{ marginTop: spacing.sm }}>
                <Button variant="ghost" title={COPY.askAdvice} onPress={() => router.push('/enquiries')} full />
              </View>
            </Card>
          </>
        )}
        <View style={{ height: 12 }} />
      </View>
      <ConfirmSheet visible={sheet} onClose={() => setSheet(false)} danger confirmLabel={busy ? '…' : 'Request deletion'}
        onConfirm={() => void send()} title="Ask the owner to delete your account?"
        lines={['The clinic reviews this personally — nothing is deleted instantly.', 'The owner will contact you if anything is unclear.']} />
    </Screen>
  );
}
