// app/admin/confirm/[requestId].tsx — Confirm into the R03 chain (09-staff-queue/01).
// decideBooking(CONFIRMED) + scheduleAppointments(chain). Dates: next 10 days; times: chips.
// Soft warns DA-05/06 shown but NEVER blocking; ADVISE_ME seeds only a consultation.
import { useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import * as db from '../../../lib/db';
import { appointmentTypeWord } from '../../../lib/content';
import { fmtDate } from '../../../lib/format';
import { useTheme } from '../../../theme/ThemeContext';
import { AppText, Button, Card, EmptyState, ErrorRetry, Eyebrow, Screen, ScreenHeader, SoftWarnBanner } from '../../../components/ui';

type Row = { type: 'CONSULTATION' | 'PATCH_TEST' | 'SESSION'; day: number; hour: number };
const HOURS = [10, 11, 12, 14, 15, 16, 17];

export default function ConfirmChain() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { colors, spacing } = useTheme();
  const [req, setReq] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([{ type: 'CONSULTATION', day: 1, hour: 10 }]);
  const [warnGap, setWarnGap] = useState<string | null>(null);

  useEffect(() => {
    void db.getRequestDetail(requestId).then(r => {
      if (r.error) { setErr(r.error); return; }
      setReq(r.data?.request ?? null);
      if (r.data?.request?.request_kind === 'TREATMENT') {
        setRows([
          { type: 'CONSULTATION', day: 1, hour: 10 },
          { type: 'PATCH_TEST', day: 2, hour: 11 },
          { type: 'SESSION', day: 21, hour: 15 },
        ]);
      }
    });
  }, [requestId]);

  if (err) return <Screen><ScreenHeader title="Confirm" onBack={() => router.back()} /><ErrorRetry message={err} onRetry={() => router.replace(`/admin/queue/${requestId}`)} /></Screen>;
  if (!req) return <Screen><ScreenHeader title="Confirm" onBack={() => router.back()} /><EmptyState title="Loading…" /></Screen>;

  const isTreatment = req.request_kind === 'TREATMENT';
  const prof = req.client_profiles ?? {};
  const startOf = (dayOffset: number, hour: number) => {
    const d = new Date(); d.setHours(hour, 0, 0, 0); d.setDate(d.getDate() + dayOffset);
    return d.toISOString();
  };

  const confirm = async () => {
    setBusy(true); setErr(null);
    const decided = await db.decideBooking(requestId, 'CONFIRMED');
    if (decided.error) { setBusy(false); setErr(decided.error); return; }
    const chain = rows.map(r => ({ type: r.type, start: startOf(r.day, r.hour) }));
    const scheduled = await db.scheduleAppointments({
      clinicId: await db.clinicId(), clientUserId: req.client_user_id,
      clientNameSnapshot: `${prof.first_name ?? 'Client'} ${prof.last_name ?? ''}`.trim(),
      requestId, treatmentId: req.treatment_id ?? undefined, chain,
    });
    setBusy(false);
    if (scheduled.error) { setErr(scheduled.error + ' — request confirmed but nothing scheduled; retry below'); return; }
    router.replace('/admin/queue');
  };

  const patchMissing = isTreatment && !rows.some(r => r.type === 'PATCH_TEST');
  const adviseOnly = req.request_kind === 'ADVISE_ME';

  return (
    <Screen canvas="pearl" scroll footer={
      <Button title={busy ? '…' : 'Schedule & confirm'} full disabled={busy} onPress={() => void confirm()} />
    }>
      <ScreenHeader title={`Confirm — ${prof.first_name ?? 'client'}`} onBack={() => router.back()}
        eyebrow={`${appointmentTypeWord(rows[0]?.type ?? 'CONSULTATION')}${isTreatment ? ' + chain' : ''}`} />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        {adviseOnly ? (
          <Card>
            <Eyebrow text="ADVISE ME — NO TREATMENT YET" />
            <AppText role="small" tone="soft" style={{ marginTop: 6 }}>
              Confirming books the consultation. The treatment (and its patch-test/session chain)
              is decided together in the room — don’t schedule blind sessions.
            </AppText>
          </Card>
        ) : null}
        {warnGap ? <SoftWarnBanner text={warnGap} /> : null}
        {patchMissing ? (
          <SoftWarnBanner text="R03: a SESSION without any PATCH_TEST in this chain — save anyway if you’re handling it separately (audited, never blocked)." />
        ) : null}

        {rows.map((r, i) => (
          <Card key={r.type}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Eyebrow text={`${'①②③'[i]} ${appointmentTypeWord(r.type).toUpperCase()}`} />
              {!adviseOnly && rows.length > 1 ? (
                <Button small variant="quiet" title="remove" onPress={() => setRows(rows.filter(x => x !== r))} />
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {[0, 1, 2, 3, 5, 7, 10, 14, 21].map(d => (
                <Press key={d} on={() => setRows(rows.map(x => x === r ? { ...x, day: d } : x))} label={d === 0 ? 'Today' : `+${d}d`} active={r.day === d} />
              ))}
            </View>
            <AppText role="caption" tone="soft" style={{ marginTop: 8, marginBottom: 6 }}>{fmtDate(startOf(r.day, 12))}</AppText>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {HOURS.map(h => (
                <Press key={h} on={() => setRows(rows.map(x => x === r ? { ...x, hour: h } : x))} label={`${h > 12 ? h - 12 : h} ${h < 12 ? 'am' : 'pm'}`} active={r.hour === h} />
              ))}
            </View>
          </Card>
        ))}

        {!adviseOnly && rows.length < 3 ? (
          <Button variant="ghost" title="+ add step to chain" full
            onPress={() => {
              const missing = (['CONSULTATION', 'PATCH_TEST', 'SESSION'] as const).find(t => !rows.some(x => x.type === t));
              if (missing) setRows([...rows, { type: missing, day: 7, hour: 15 }]);
            }} />
        ) : null}

        <Card>
          <AppText role="small" tone="soft">On confirm: {rows.length} appointment row(s) are created and linked to this request; the client sees them on their home immediately (generic notification only — R06).</AppText>
        </Card>
        <View style={{ height: 20 }} />
      </View>
    </Screen>
  );
}

function Press({ on, label, active }: { on: () => void; label: string; active: boolean }) {
  const { colors, radii, fonts, typography } = useTheme();
  return (
    <Text onPress={on} style={[typography.small, {
      fontFamily: fonts.bodyMedium, color: active ? colors.pearl : colors.ink,
      backgroundColor: active ? colors.plum : colors.white, borderWidth: 1,
      borderColor: active ? colors.plum : colors.rose, borderRadius: radii.sm,
      paddingHorizontal: 10, paddingVertical: 7, overflow: 'hidden',
    }]}>{label}</Text>
  );
}
