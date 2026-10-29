// app/admin/queue/[requestId].tsx — triage detail (09/00): snapshot, verbatim note, chain context,
// Confirm → chain scheduler; Decline/Propose sheets (reason verbatim → client sees 04/02 wording).
import { useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';

import * as db from '../../../lib/db';
import { COPY, bookingStatusWord, requestKindWord } from '../../../lib/content';
import { bandWord } from '../../../components/Domain';
import { fmtDate, fmtDateTime } from '../../../lib/format';
import { useTheme } from '../../../theme/ThemeContext';
import { AppText, Badge, Button, Card, Divider, EmptyState, ErrorRetry, Eyebrow, Field, Screen, ScreenHeader } from '../../../components/ui';
import { BottomSheet } from '../../../components/Sheets';

export default function QueueDetail() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { colors, spacing } = useTheme();
  const [detail, setDetail] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | 'decline' | 'propose'>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => { const r = await db.getRequestDetail(requestId); if (r.error) setErr(r.error); else setDetail(r.data); };
  useEffect(() => { void load(); }, [requestId]);

  const decide = async () => {
    if (!sheet) return;
    setBusy(true);
    const decision = sheet === 'decline' ? 'DECLINED' : 'RESCHEDULED';
    const r = await db.decideBooking(requestId, decision as any, reason.trim() || (sheet === 'decline' ? undefined : 'Alternative proposed — the clinic will call.'));
    setBusy(false); setSheet(null); setReason('');
    if (r.error) setErr(r.error);
    void load();
  };

  if (err) return <Screen><ScreenHeader title="Request" onBack={() => router.back()} /><ErrorRetry message={err} onRetry={load} /></Screen>;
  if (!detail) return <Screen><ScreenHeader title="Request" onBack={() => router.back()} /><EmptyState title="Loading…" /></Screen>;
  const { request, events, appointments } = detail;
  const prof = request.client_profiles ?? {};
  const name = `${prof.first_name ?? ''} ${prof.last_name ?? ''}`.trim() || 'Client';
  const decided = request.status !== 'PENDING';

  return (
    <Screen canvas="pearl" scroll footer={decided ? undefined : (
      <View style={{ gap: 8 }}>
        <Button title="✓ Confirm & schedule" full onPress={() => router.push(`/admin/confirm/${request.id}`)} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Button variant="ghost" title="Propose a day" onPress={() => setSheet('propose')} full /></View>
          <View style={{ flex: 1 }}><Button variant="dangerText" title="Decline…" onPress={() => setSheet('decline')} full /></View>
        </View>
      </View>
    )}>
      <ScreenHeader title="Request" onBack={() => router.back()} eyebrow={bookingStatusWord(request.status).toUpperCase()} />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <AppText role="h3">{name}</AppText>
              <AppText role="small" tone="soft">{prof.phone_e164 ? prof.phone_e164.replace(/^\+44/, '0') : 'no number on file'}</AppText>
            </View>
            <View style={{ gap: 6, alignItems: 'flex-end' }}>
              <Badge tone={prof.phone_verified_at ? 'success' : 'warn'} text={prof.phone_verified_at ? '✓ verified' : '⚠ unverified'} />
              {prof.phone_e164 ? <Button small variant="ghost" title="☎ Call" onPress={() => void Linking.openURL(`tel:${prof.phone_e164}`)} /> : null}
            </View>
          </View>
        </Card>

        <Card>
          <Eyebrow text={requestKindWord(request.request_kind).toUpperCase()} />
          <AppText role="bodyMedium" style={{ marginTop: 4 }}>
            {request.treatment_name_snapshot ?? COPY.adviseMe}
            {request.price_from_pence_snapshot != null ? ` · from £${request.price_from_pence_snapshot / 100}` : ''}
          </AppText>
          <AppText role="small" tone="soft">prefers {fmtDate(request.preferred_date)} · {bandWord(request.preferred_time_band)}</AppText>
          {request.notes_client ? (
            <View style={{ backgroundColor: colors.pearl, borderRadius: 8, padding: 10, marginTop: 8 }}>
              <AppText role="caption" tone="soft">NOTE (VERBATIM)</AppText>
              <AppText role="small" style={{ fontStyle: 'italic' }}>“{request.notes_client}”</AppText>
            </View>
          ) : null}
          <Divider />
          <AppText role="small" tone="soft">Sent {fmtDateTime(request.created_at)}
            {decided ? ` · ${bookingStatusWord(request.status)}${request.decision_reason ? ` — “${request.decision_reason}”` : ''}` : ' · awaiting callback — ' + COPY.oneWorkingDay.toLowerCase()}</AppText>
        </Card>

        {appointments.length ? (
          <Card>
            <Eyebrow text="LINKED SCHEDULE" />
            {appointments.map((a: any) => (
              <AppText key={a.id} role="small" tone="soft" style={{ marginTop: 4 }}>
                • {a.type === 'CONSULTATION' ? 'Consultation' : a.type === 'PATCH_TEST' ? 'Patch test' : 'Session'} — {fmtDateTime(a.scheduled_start)} ({a.status.toLowerCase()})
              </AppText>
            ))}
          </Card>
        ) : (
          <Card>
            <Eyebrow text="THE CHAIN BEFORE A SESSION (R03)" />
            <AppText role="small" tone="soft" style={{ marginTop: 6 }}>
              ① Free consultation → ② Patch test (24–48 h before) → ③ Session. Confirming creates
              the schedule the client sees at home.
            </AppText>
          </Card>
        )}

        {events.length ? (
          <View style={{ paddingHorizontal: 2, marginBottom: 20 }}>
            <Eyebrow text="AUDIT TRAIL" />
            {events.map((e: any) => (
              <AppText key={`${e.created_at}-${e.action}`} role="caption" tone="soft" style={{ marginTop: 3 }}>
                {new Date(e.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} · {e.action.toLowerCase()} ({e.actor_role})
              </AppText>
            ))}
          </View>
        ) : null}
      </View>

      <BottomSheet visible={!!sheet} onClose={() => { setSheet(null); setReason(''); }} half>
        <AppText role="h3">{sheet === 'decline' ? 'Decline this request?' : 'Propose another day'}</AppText>
        <AppText role="small" tone="soft" style={{ marginVertical: 8 }}>
          {sheet === 'decline'
            ? 'Clients see this exact wording — plain, warm, no invented policy (no fees, no strikes).'
            : 'The client still expects the phone call to lock it (R02 — no self-service accept in the app).'}
        </AppText>
        <Field label={sheet === 'decline' ? 'Reason (shown to the client)' : 'What to suggest (shown to the client)'}
          value={reason} onChange={setReason} multiline
          placeholder={sheet === 'decline' ? '“All appointments that week are full — shall I hold Tue?”' : '“Could Wed morning instead — I’ll ring to confirm.”'} />
        <Button title={busy ? '…' : sheet === 'decline' ? 'Decline' : 'Send proposal'}
          variant={sheet === 'decline' ? 'dangerText' : 'primary'} full
          disabled={busy || (sheet === 'decline' && !reason.trim())} onPress={() => void decide()} />
      </BottomSheet>
    </Screen>
  );
}
