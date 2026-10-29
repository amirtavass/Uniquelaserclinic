// app/admin/(tabs)/dial.tsx — ☎ Dial: audited directory search (10/00) + today’s diary board
// with COMPLETED/NO_SHOW outcomes (11/00/01), per the locked shell (Dial hosts the day).
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import * as db from '../../../lib/db';
import { CLINIC, COPY, appointmentTypeWord, appointmentStatusWord } from '../../../lib/content';
import { useTheme } from '../../../theme/ThemeContext';
import { AppText, Badge, Button, Card, Divider, EmptyState, ErrorRetry, Eyebrow, Screen, ScreenHeader } from '../../../components/ui';
import { SearchField } from '../../../components/Domain';
import { ConfirmSheet } from '../../../components/Sheets';

const DAY_START = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); };
const DAY_END = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d.toISOString(); };

export default function Dial() {
  const { colors, spacing } = useTheme();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<any[] | null>(null);
  const [day, setDay] = useState<any[] | null>(null);
  const [changes, setChanges] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [missConfirm, setMissConfirm] = useState<any | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadDay = async () => {
    const [a, c] = await Promise.all([db.staffAppointmentsOn(DAY_START(), DAY_END()), db.staffChangeRequests()]);
    if (a.error) setErr(a.error); else { setDay(a.data ?? []); setErr(null); }
    setChanges(c.data ?? []);
  };
  useEffect(() => { void loadDay(); }, []);
  useEffect(() => {
    if (!q.trim()) { setHits(null); return; }
    const t = setTimeout(async () => {
      const r = await db.searchClients(q.trim());
      if (r.error) setErr(r.error); else setHits(r.data ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const outcome = async (id: string, kind: 'COMPLETED' | 'NO_SHOW') => {
    const r = await db.recordAppointmentOutcome(id, kind);
    if (r.error) setErr(r.error);
    else { setToast(kind === 'COMPLETED' ? 'Completed ✓ — the client sees it in the app' : 'Did-not-attend recorded for today'); setTimeout(() => setToast(null), 2500); void loadDay(); }
  };

  return (
    <Screen canvas="pearl" scroll>
      <ScreenHeader title="Dial & diary" eyebrow="EVERY LOOKUP IS AUDITED (S18)" />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        {err ? <ErrorRetry message={err} onRetry={loadDay} extraLabel={`Call ${CLINIC.phoneDisplay}`} onExtra={() => void Linking.openURL(`tel:${CLINIC.phoneTel}`)} /> : null}
        {toast ? <Card><AppText tone="success">✓ {toast}</AppText></Card> : null}

        <SearchField value={q} onChange={setQ} placeholder="Name or number…" />
        {hits ? (
          hits.length ? hits.map(p => (
            <Pressable key={p.id} onPress={() => router.push(`/admin/client/${p.user_id}`)}>
              <Card style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <AppText role="bodyMedium" style={{ flex: 1 }}>{p.first_name} {p.last_name}</AppText>
                  <Badge tone={p.phone_verified_at ? 'success' : 'warn'} text={p.phone_verified_at ? '✓' : '⚠ unverified'} />
                  <AppText role="small" tone="soft">{p.phone_e164?.replace(/^\+44/, '0')}</AppText>
                </View>
              </Card>
            </Pressable>
          )) : (
            <Card>
              <AppText role="bodyMedium">Nobody here under “{q}”.</AppText>
              <AppText role="small" tone="soft" style={{ marginTop: 6 }}>
                New clients create their own account in the app or at the clinic site — have them
                sign up (2 min), then they’ll appear here instantly. {COPY.askAdvice} in-person too.
              </AppText>
            </Card>
          )
        ) : null}

        <Divider />
        <Eyebrow text={`TODAY · ${day?.length ?? '—'} BOOKED`} />
        {changes.length ? (
          <Card style={{ borderColor: colors.goldLine }}>
            <AppText role="small" tone="danger">⚑ {changes.length} client change request{changes.length > 1 ? 's' : ''} waiting (cancel / reschedule)</AppText>
          </Card>
        ) : null}
        {day && day.length === 0 ? (
          <EmptyState icon="🗓" title="Quiet today — nothing scheduled"
            lines={['Walk-ins are welcome in quiet times (site copy) — this board mirrors what’s booked in the app.']} />
        ) : null}
        {(day ?? []).map(a => {
          const warn = a.status === 'CANCEL_REQUESTED' || a.status === 'RESCHEDULE_REQUESTED';
          return (
            <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.pearl }}>
              <AppText role="caption" style={{ width: 46 }}>{new Date(a.scheduled_start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</AppText>
              <View style={{ flex: 1 }}>
                <AppText role="bodyMedium">{a.client_name_snapshot} · {appointmentTypeWord(a.type)}</AppText>
                <AppText role="caption" tone="soft">{appointmentStatusWord(a.status)}</AppText>
              </View>
              {a.status === 'SCHEDULED' ? (
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Button small variant="ghost" title="Done" onPress={() => void outcome(a.id, 'COMPLETED')} />
                  <Button small variant="dangerText" title="Missed" onPress={() => setMissConfirm(a)} />
                </View>
              ) : warn ? <Badge tone="warn" text="needs resolve" /> : <Badge text="—" />}
            </View>
          );
        })}
        <View style={{ height: 20 }} />
      </View>

      <ConfirmSheet visible={!!missConfirm} onClose={() => setMissConfirm(null)} danger confirmLabel="Record missed"
        title="Record did not attend?" onConfirm={() => { const a = missConfirm; setMissConfirm(null); if (a) void outcome(a.id, 'NO_SHOW'); }}
        lines={[`${missConfirm?.client_name_snapshot ?? ''} · ${missConfirm ? appointmentTypeWord(missConfirm.type) : ''} ${missConfirm ? new Date(missConfirm.scheduled_start).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' }) : ''}`,
          'This doesn’t charge or block anything; it’s the clinic’s record of today.']} />
    </Screen>
  );
}
