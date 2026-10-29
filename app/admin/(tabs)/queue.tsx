// app/admin/(tabs)/queue.tsx — 📥 Queue L1 (09-staff-queue/00): newest-first, unseen dots,
// booking requests + client change requests merged (locked shell), ☎ one-tap callback (R02).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import * as db from '../../../lib/db';
import { CLINIC } from '../../../lib/content';
import { fmtDate } from '../../../lib/format';
import { useTheme } from '../../../theme/ThemeContext';
import { AppText, Badge, EmptyState, ErrorRetry, Eyebrow, Screen } from '../../../components/ui';
import { RequestCard } from '../../../components/Domain';

export default function Queue() {
  const { colors, spacing } = useTheme();
  const [pending, setPending] = useState<any[] | null>(null);
  const [changes, setChanges] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [seenAt, setSeenAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    const [q, c] = await Promise.all([db.staffQueue(), db.staffChangeRequests()]);
    if (q.error) setErr(q.error);
    else { setPending(q.data ?? []); setChanges(c.data ?? []); setErr(null); }
    setRefreshing(false);
  };
  useEffect(() => { void load(); void AsyncStorage.getItem('queueSeenAt').then(setSeenAt); }, []);

  const unseen = (iso: string) => !seenAt || new Date(iso) > new Date(seenAt);
  const markSeen = async () => {
    const now = new Date().toISOString();
    await AsyncStorage.setItem('queueSeenAt', now); setSeenAt(now);
  };

  const open = (id: string) => { void markSeen(); router.push(`/admin/queue/${id}`); };
  const todayISO = new Date().toISOString().slice(0, 10);
  const grouped = (pending ?? []).reduce<Record<string, any[]>>((acc, r) => {
    const key = r.created_at.slice(0, 10) === todayISO ? 'TODAY' : fmtDate(r.created_at).toUpperCase();
    (acc[key] ??= []).push(r); return acc;
  }, {});

  return (
    <Screen canvas="pearl" refresh={load} refreshing={refreshing}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: 12, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Eyebrow text="BOOKING REQUESTS" />
          <AppText role="h1" style={{ fontSize: 26 }}>{pending?.length ?? '—'} in queue</AppText>
        </View>
        {changes.length ? <Badge tone="warn" text={`${changes.length} change request${changes.length > 1 ? 's' : ''}`} /> : null}
      </View>
      <Pressable onPress={() => router.push('/admin/dial')}>
        <View style={{ marginHorizontal: spacing.lg, marginBottom: spacing.sm, backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.rose, padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText role="small" tone="soft">☎ Who’s calling? — directory & today’s diary</AppText>
          <AppText tone="soft">›</AppText>
        </View>
      </Pressable>

      {err ? <ErrorRetry onRetry={load} extraLabel={`Call ${CLINIC.phoneDisplay}`} onExtra={() => void Linking.openURL(`tel:${CLINIC.phoneTel}`)} /> : null}
      {pending === null && !err ? <EmptyState title="Loading the queue…" /> : null}
      {pending && pending.length === 0 && changes.length === 0 ? (
        <EmptyState icon="✓" title="Inbox zero — nothing waiting"
          lines={['Walk-ins and callbacks still happen — this view mirrors what clients send.']} />
      ) : null}

      <View style={{ paddingHorizontal: spacing.lg, gap: 2 }}>
        {changes.map(c => (
          <Pressable key={c.id} onPress={() => router.push('/admin/dial')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.rose, borderRadius: 10, padding: spacing.md, marginBottom: spacing.sm }}>
              <AppText style={{ flex: 1 }} role="small">{c.client_name_snapshot} — {c.status === 'CANCEL_REQUESTED' ? 'asks to cancel' : 'asks to reschedule'} · {c.type.toLowerCase()} {fmtDate(c.scheduled_start)}</AppText>
              <Badge tone="warn" text="Resolve in Diary ›" />
            </View>
          </Pressable>
        ))}
        {Object.entries(grouped).map(([day, rows]) => (
          <View key={day}>
            <Eyebrow text={`${day} · ${rows.length} NEW`} style={{ marginVertical: 6 }} />
            {rows.map(r => (
              <RequestCard key={r.id} r={r} unseen={unseen(r.created_at)}
                onOpen={() => open(r.id)}
                onCall={() => r.client_profiles?.phone_e164 && Linking.openURL(`tel:${r.client_profiles.phone_e164}`)} />
            ))}
          </View>
        ))}
        <View style={{ height: 24 }} />
      </View>
    </Screen>
  );
}
