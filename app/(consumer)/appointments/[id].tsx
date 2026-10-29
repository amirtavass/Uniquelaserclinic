// app/(consumer)/appointments/[id].tsx — detail + R03 chain tracker (05/01) + request-only
// cancel/reschedule (05/02, S10/DA-07 — no policy invented, no self-cancel).
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';

import * as db from '../../../lib/db';
import { CLINIC, COPY, appointmentStatusWord, appointmentTypeWord } from '../../../lib/content';
import { fmtDateTime } from '../../../lib/format';
import { useTheme } from '../../../theme/ThemeContext';
import { AppText, Badge, Button, Card, Divider, EmptyState, ErrorRetry, Eyebrow, Screen, ScreenHeader } from '../../../components/ui';
import { ChainStepper } from '../../../components/Domain';
import { ConfirmSheet } from '../../../components/Sheets';

export default function AppointmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, spacing, radii } = useTheme();
  const [mine, setMine] = useState<any | null>(null);
  const [all, setAll] = useState<any[]>([]);
  const [treatName, setTreatName] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | 'CANCEL_REQUESTED' | 'RESCHEDULE_REQUESTED'>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    const [a, t] = await Promise.all([db.myAppointments(), db.getTreatments()]);
    if (a.error) { setErr(a.error); return; }
    setErr(null);
    setAll(a.data ?? []);
    const row = (a.data ?? []).find(x => x.id === id) ?? null;
    setMine(row);
    setTreatName(row?.treatment_id ? ((t.data ?? []).find(x => x.id === row.treatment_id)?.name ?? null) : null);
  };
  useEffect(() => { void load(); }, [id]);

  if (err) return <Screen><ScreenHeader title="Appointment" onBack={() => router.back()} /><ErrorRetry onRetry={load} /></Screen>;
  if (!mine) return <Screen><ScreenHeader title="Appointment" onBack={() => router.back()} /><EmptyState title="Loading…" /></Screen>;

  const upcoming = mine.status === 'SCHEDULED';

  const send = async (kind: 'CANCEL_REQUESTED' | 'RESCHEDULE_REQUESTED') => {
    setBusy(true);
    const r = await db.requestAppointmentChange(mine.id, kind);
    setBusy(false); setSheet(null);
    if (r.error) { setErr(r.error); return; }
    setDone(kind === 'CANCEL_REQUESTED' ? 'Cancel request sent — the clinic will call you.' : 'Reschedule request sent — the clinic will call you.');
    void load();
  };

  return (
    <Screen canvas="pearl" scroll
      footer={upcoming ? (
        <View style={{ gap: 8 }}>
          <Button variant="ghost" title="Cancel this appointment" onPress={() => setSheet('CANCEL_REQUESTED')} full />
          <Button variant="quiet" title="Ask for a different time" onPress={() => setSheet('RESCHEDULE_REQUESTED')} full />
        </View>
      ) : undefined}>
      <ScreenHeader title={appointmentTypeWord(mine.type)} onBack={() => router.back()} />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        {done ? <Card><AppText tone="success">✓ {done}</AppText></Card> : null}
        {treatName ? <Eyebrow text={treatName.toUpperCase()} /> : null}
        <Card>
          <AppText role="h3">{appointmentTypeWord(mine.type)}{treatName ? ` · ${treatName}` : ''}</AppText>
          <AppText role="body" tone="soft" style={{ marginTop: 4 }}>{fmtDateTime(mine.scheduled_start)}</AppText>
          <View style={{ marginTop: 8 }}>
            <Badge tone={mine.status === 'SCHEDULED' ? 'success' : mine.status === 'COMPLETED' ? 'neutral' : 'warn'} text={appointmentStatusWord(mine.status)} />
          </View>
        </Card>

        {/* R03 chain position */}
        <Card>
          <Eyebrow text="YOUR TREATMENT JOURNEY" />
          <ChainStepper appts={all} />
          <AppText role="small" tone="soft">{COPY.freeConsultAndPatch}</AppText>
        </Card>

        <Card>
          <AppText role="bodyMedium">{CLINIC.address}</AppText>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md }}>
            <View style={{ flex: 1 }}><Button small variant="ghost" title="Directions" onPress={() => void Linking.openURL(CLINIC.mapUrl)} /></View>
            <View style={{ flex: 1 }}><Button small variant="ghost" title={`Call ${CLINIC.phoneDisplay}`} onPress={() => void Linking.openURL(`tel:${CLINIC.phoneTel}`)} /></View>
          </View>
        </Card>
        <Divider />
        <AppText role="caption" tone="soft" style={{ borderRadius: radii.sm }}>
          Cancelling or moving is a request — there are no automatic fees or blocks in this app.
        </AppText>
        <View style={{ height: 20 }} />
      </View>

      <ConfirmSheet visible={!!sheet} onClose={() => setSheet(null)} danger={sheet === 'CANCEL_REQUESTED'}
        confirmLabel={busy ? '…' : 'Send request'} onConfirm={() => sheet && void send(sheet)}
        title={sheet === 'CANCEL_REQUESTED' ? 'Send a cancel request?' : 'Ask for a different time?'}
        lines={[
          'The clinic sees it instantly and calls to sort the rest — this doesn’t cancel anything by itself.',
        ]} />
    </Screen>
  );
}
