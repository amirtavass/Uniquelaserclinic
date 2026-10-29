// app/(consumer)/requests.tsx — My requests list (04-book/02). Words not enums; no timers (R02).
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import * as db from '../../lib/db';
import { COPY } from '../../lib/content';
import { bookingStatusWord, requestKindWord } from '../../lib/content';
import { fmtDate, relativeDayLabel } from '../../lib/format';
import { useTheme } from '../../theme/ThemeContext';
import { AppText, Badge, Button, Card, EmptyState, ErrorRetry, Screen, ScreenHeader } from '../../components/ui';

export default function Requests() {
  const router = useRouter();
  const { spacing } = useTheme();
  const [rows, setRows] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const load = async () => {
    setRefreshing(true);
    const r = await db.myRequests();
    if (r.error) setErr(r.error); else { setRows(r.data ?? []); setErr(null); }
    setRefreshing(false);
  };
  useEffect(() => { void load(); }, []);

  return (
    <Screen canvas="pearl" refresh={load} refreshing={refreshing} scroll
      footer={<Button title="✦ New request" onPress={() => router.replace('/intent')} full />}>
      <ScreenHeader title="My requests" onBack={() => router.back()} />
      {err ? <ErrorRetry onRetry={load} /> : null}
      {rows && rows.length === 0 ? (
        <EmptyState icon="✦" title="No requests yet"
          lines={['Most people start with a free consultation.']}
          actionLabel="✦ Request an appointment" onAction={() => router.replace('/intent')} />
      ) : null}
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        {(rows ?? []).map(r => (
          <Card key={r.id}>
            <AppText role="bodyMedium">{r.treatment_name_snapshot ?? requestKindWord(r.request_kind)}</AppText>
            <AppText role="small" tone="soft">
              {relativeDayLabel(r.preferred_date)} · {r.preferred_time_band ? r.preferred_time_band.toLowerCase() : 'any time'}
            </AppText>
            {r.notes_client ? <AppText role="small" tone="soft" style={{ fontStyle: 'italic' }}>“{r.notes_client}”</AppText> : null}
            <View style={{ marginTop: 8 }}>
              <Badge tone={r.status === 'PENDING' ? 'neutral' : r.status === 'CONFIRMED' ? 'success' : r.status === 'DECLINED' ? 'danger' : 'warn'}
                text={bookingStatusWord(r.status)} />
            </View>
            {r.status === 'DECLINED' && r.decision_reason ? (
              <AppText role="small" tone="danger" style={{ marginTop: 6 }}>“{r.decision_reason}”</AppText>
            ) : null}
            {r.status === 'CONFIRMED' ? (
              <AppText role="small" tone="success" style={{ marginTop: 6 }}>Confirmed — see appointments (a patch test comes first)</AppText>
            ) : null}
            {r.status === 'RESCHEDULED' ? (
              <AppText role="small" tone="soft" style={{ marginTop: 6 }}>Alternative proposed — the clinic will call to arrange it.</AppText>
            ) : null}
            {r.status === 'PENDING' ? <AppText role="caption" tone="soft" style={{ marginTop: 6 }}>Sent {fmtDate(r.created_at)}</AppText> : null}
          </Card>
        ))}
        {rows && rows.some(r => r.status === 'DECLINED') ? (
          <Button variant="quiet" title={`${COPY.askAdvice} about alternatives`} onPress={() => router.push('/enquiries')} />
        ) : null}
        <View style={{ height: 20 }} />
      </View>
    </Screen>
  );
}
