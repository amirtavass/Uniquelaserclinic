// app/(consumer)/updates/index.tsx — public updates feed + read marking (07/00, S08).
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import * as db from '../../../lib/db';
import { useAuth } from '../../../providers/AuthProvider';
import { useTheme } from '../../../theme/ThemeContext';
import { AppText, Card, EmptyState, ErrorRetry, Screen, ScreenHeader } from '../../../components/ui';

export default function Updates() {
  const router = useRouter();
  const { user } = useAuth();
  const { spacing } = useTheme();
  const [rows, setRows] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    const r = await db.getPublishedUpdates();
    if (r.error) setErr(r.error); else { setRows(r.data ?? []); setErr(null); }
    setRefreshing(false);
  };
  useEffect(() => { void load(); }, []);

  const openRow = (u: any) => {
    setOpen(open === u.id ? null : u.id);
    if (user && open !== u.id) void db.markUpdateRead(u.id);
  };

  return (
    <Screen canvas="pearl" refresh={load} refreshing={refreshing}>
      <ScreenHeader title="Clinic updates" onBack={() => router.back()} />
      {err ? <ErrorRetry onRetry={load} /> : null}
      {rows && rows.length === 0 ? (
        <EmptyState icon="📰" title="No updates right now" lines={['News lands here first — open when it’s quiet.']} />
      ) : null}
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        {(rows ?? []).map(u => (
          <Pressable key={u.id} onPress={() => openRow(u)}>
            <Card>
              <AppText role="bodyMedium">{u.title}</AppText>
              <AppText role="caption" tone="soft">{new Date(u.published_at ?? u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</AppText>
              {open === u.id ? <AppText role="body" tone="soft" style={{ marginTop: 8, lineHeight: 23 }}>{u.body}</AppText> : null}
            </Card>
          </Pressable>
        ))}
        <View style={{ height: 20 }} />
      </View>
    </Screen>
  );
}
