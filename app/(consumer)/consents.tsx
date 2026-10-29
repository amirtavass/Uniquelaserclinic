// app/(consumer)/consents.tsx — R08 consent centre (08/01). Writes before switches flip.
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';

import * as db from '../../lib/db';
import { CLINIC } from '../../lib/content';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../theme/ThemeContext';
import { AppText, Badge, Button, Card, Divider, ErrorRetry, Eyebrow, LinkText, Screen, ScreenHeader, ToggleRow } from '../../components/ui';
import { ConfirmSheet } from '../../components/Sheets';

const POLICY_V = 'demo-2026-10';
const HASH = 'demo'.padEnd(64, '0');

export default function Consents() {
  const router = useRouter();
  const { user } = useAuth();
  const { spacing } = useTheme();
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [confirmOff, setConfirmOff] = useState<'MARKETING' | 'NOTIFICATIONS' | null>(null);
  const load = async () => { const r = await db.getMyConsents(); if (r.error) setErr(r.error); else setRows(r.data ?? []); };
  useEffect(() => { void load(); }, []);

  const latest = (kind: string) => [...rows].filter(r => r.kind === kind).sort((a, b) => a.recorded_at.localeCompare(b.recorded_at)).at(-1);
  const isOn = (kind: string) => latest(kind)?.decision === 'GRANTED';

  const set = async (kind: 'MARKETING' | 'NOTIFICATIONS', decision: 'GRANTED' | 'WITHDRAWN') => {
    if (!user) return;
    const r = await db.recordConsent({ userId: user.id, kind, policyVersion: POLICY_V, policyTextHash: HASH, decision });
    setConfirmOff(null);
    if (r.error) setErr(r.error); else void load();
  };

  return (
    <Screen canvas="pearl" scroll>
      <ScreenHeader title="Notifications & marketing" onBack={() => router.back()} />
      {err ? <ErrorRetry message={err} onRetry={load} /> : null}
      <View style={{ paddingHorizontal: spacing.lg, gap: 4 }}>
        <Card>
          <ToggleRow label="Appointment reminders" sub="Push, 24 h before confirmed visits — off means you still see them in-app" value={isOn('NOTIFICATIONS')} onChange={v => (v ? void set('NOTIFICATIONS', 'GRANTED') : setConfirmOff('NOTIFICATIONS'))} />
          <Divider />
          <ToggleRow label="News & offers by email" value={isOn('MARKETING')} onChange={v => (v ? void set('MARKETING', 'GRANTED') : setConfirmOff('MARKETING'))} />
          <Divider />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <AppText role="bodyMedium">Data processing</AppText>
              <AppText role="caption" tone="soft">Required to hold your bookings.</AppText>
            </View>
            <Badge tone="success" text={`Agreed · v${POLICY_V}`} />
          </View>
          <AppText role="caption" tone="soft" style={{ marginTop: 8 }}>
            Recorded {latest('DATA_PROCESSING')?.recorded_at?.slice(0, 10) ?? '—'} · <LinkText label="Privacy notice" onPress={() => void Linking.openURL(`${CLINIC.site}/privacy-policy/`)} />
          </AppText>
        </Card>
        <Eyebrow text="YOUR CHOICES ARE STORED AS DATED RECORDS" style={{ marginVertical: spacing.md }} />
        <AppText role="small" tone="soft">You can change them any time. Withdrawal takes effect the moment it’s saved.</AppText>
        <View style={{ marginTop: spacing.lg }}>
          <Button variant="dangerText" title="Request data deletion" onPress={() => router.push('/deletion')} full />
        </View>
        <View style={{ height: 20 }} />
      </View>
      <ConfirmSheet visible={!!confirmOff} onClose={() => setConfirmOff(null)} danger
        confirmLabel="Turn off" title={confirmOff === 'NOTIFICATIONS' ? 'Turn off reminders?' : 'Stop marketing emails?'}
        lines={[confirmOff === 'NOTIFICATIONS' ? 'We’ll stop pushing reminders; the in-app list keeps working.' : 'We’ll stop emailing offers. Booking confirmations still come through.'] }
        onConfirm={() => confirmOff && void set(confirmOff, 'WITHDRAWN')} />
    </Screen>
  );
}
