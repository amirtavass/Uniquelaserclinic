// app/admin/client/[userId].tsx — staff client view (10-staff-dialler/01). Zero health data (R04).
import { useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';

import * as db from '../../../lib/db';
import { CLINIC, appointmentTypeWord, bookingStatusWord } from '../../../lib/content';
import { fmtDateTime } from '../../../lib/format';
import { useTheme } from '../../../theme/ThemeContext';
import { AppText, Badge, Button, Card, Divider, EmptyState, ErrorRetry, Eyebrow, Screen, ScreenHeader } from '../../../components/ui';
import { ChainStepper } from '../../../components/Domain';

export default function StaffClientDetail() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { spacing, colors } = useTheme();
  const [detail, setDetail] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { void db.staffClientDetail(userId).then(r => { if (r.error) setErr(r.error); else setDetail(r.data); }); }, [userId]);

  if (err) return <Screen><ScreenHeader title="Client" onBack={() => router.back()} /><ErrorRetry message={err} onRetry={() => router.back()} /></Screen>;
  if (!detail) return <Screen><ScreenHeader title="Client" onBack={() => router.back()} /><EmptyState title="Loading…" /></Screen>;
  const { profile, requests, appointments } = detail;
  if (!profile) return <Screen><ScreenHeader title="Client" onBack={() => router.back()} /><EmptyState icon="🔒" title="No profile found" lines={['The number may be pseudonymised (GDPR pipeline).']} /></Screen>;
  const up = appointments.filter((a: any) => a.status === 'SCHEDULED');
  const past = appointments.filter((a: any) => a.status !== 'SCHEDULED');

  return (
    <Screen canvas="pearl" scroll>
      <ScreenHeader title={`${profile.first_name} ${profile.last_name}`} onBack={() => router.back()}
        right={profile.phone_e164 ? <Button small variant="secondary" title="☎" onPress={() => void Linking.openURL(`tel:${profile.phone_e164}`)} /> : undefined} />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Badge tone={profile.phone_verified_at ? 'success' : 'warn'} text={profile.phone_verified_at ? '✓ verified number' : '⚠ number unverified'} />
          <Badge text={`with us ${new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`} />
        </View>
        <AppText role="small" tone="soft">{profile.phone_e164?.replace(/^\+44/, '0') ?? 'no number'} · client since {new Date(profile.created_at).getFullYear()}</AppText>

        <Divider />
        <Eyebrow text="UPCOMING" />
        {up.length ? (
          <Card>
            <ChainStepper appts={appointments} />
            {up.map((a: any) => (
              <AppText key={a.id} role="small" tone="soft" style={{ marginTop: 4 }}>• {appointmentTypeWord(a.type)} — {fmtDateTime(a.scheduled_start)}</AppText>
            ))}
          </Card>
        ) : <AppText role="small" tone="soft">Nothing booked ahead.</AppText>}

        {requests.length ? (
          <>
            <Eyebrow text="REQUESTS" />
            {requests.slice(0, 4).map((r: any) => (
              <Card key={r.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <AppText role="small" style={{ flex: 1 }}>{r.treatment_name_snapshot ?? 'Advise me'} · {new Date(r.preferred_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</AppText>
                  <Badge tone={r.status === 'PENDING' ? 'neutral' : r.status === 'CONFIRMED' ? 'success' : r.status === 'DECLINED' ? 'danger' : 'warn'} text={bookingStatusWord(r.status)} />
                </View>
              </Card>
            ))}
          </>
        ) : null}

        {past.length ? (
          <>
            <Eyebrow text="HISTORY" />
            {past.slice(0, 5).map((a: any) => (
              <View key={a.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.pearl }}>
                <AppText role="small">{appointmentTypeWord(a.type)} · {fmtDateTime(a.scheduled_start)}</AppText>
                <Badge tone={a.status === 'COMPLETED' ? 'success' : a.status === 'NO_SHOW' ? 'danger' : 'neutral'} text={bookingStatusWord(a.status) === 'Did not attend' ? 'Did not attend' : (a.status === 'COMPLETED' ? 'Done' : a.status.toLowerCase())} />
              </View>
            ))}
          </>
        ) : null}

        <Card>
          <AppText role="small" tone="soft">This view shows contacts and bookings only — the app never collects health details (they’re discussed at the consultation).</AppText>
          <AppText role="caption" tone="soft" style={{ marginTop: 6 }}>Directory opens are audited (S18) · clinic line {CLINIC.phoneDisplay}</AppText>
        </Card>
        <View style={{ height: 20 }} />
      </View>
    </Screen>
  );
}
