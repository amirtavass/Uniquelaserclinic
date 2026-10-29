// app/(consumer)/enquiries/index.tsx — enquiry inbox + compose (06-enquiries/00, S09).
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import * as db from '../../../lib/db';
import { COPY } from '../../../lib/content';
import { useAuth } from '../../../providers/AuthProvider';
import { useTheme } from '../../../theme/ThemeContext';
import { AppText, Badge, Button, Card, Divider, EmptyState, ErrorRetry, Field, Screen, ScreenHeader } from '../../../components/ui';
import { SearchField } from '../../../components/Domain';

export default function Enquiries() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, spacing } = useTheme();
  const [rows, setRows] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => { const r = await db.myEnquiries(); if (r.error) setErr(r.error); else setRows(r.data ?? []); };
  useEffect(() => { void load(); }, []);

  const send = async () => {
    if (!user || !body.trim()) return;
    setBusy(true);
    const r = await db.createEnquiry({ clientUserId: user.id, clinicId: await db.clinicId(), firstMessage: body.trim() });
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    setBody('');
    router.push(`/enquiries/${r.data.id}`);
  };

  return (
    <Screen canvas="pearl" scroll>
      <ScreenHeader title="Ask the clinic" onBack={() => router.back()} />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        {err ? <ErrorRetry message={err} onRetry={load} /> : null}
        <Card>
          <Field label="Your question" value={body} onChange={setBody} multiline
            placeholder="e.g. Do I need to stop shaving before a patch test?"
            helper="ⓘ Please don’t include medical details — that’s discussed at your consultation." />
          <Button title={busy ? '…' : 'Send'} disabled={!body.trim() || busy} onPress={() => void send()} full />
        </Card>
        <Divider />
        <AppText role="h3">Your conversations</AppText>
        {rows && rows.length === 0 ? (
          <EmptyState icon="💬" title="No conversations yet" lines={['Send a question above — replies land here.']} />
        ) : null}
        {(rows ?? []).map(e => (
          <Pressable key={e.id} onPress={() => router.push(`/enquiries/${e.id}`)}>
            <Card style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <AppText role="bodyMedium" style={{ flex: 1 }}>
                  Question from {new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </AppText>
                <Badge tone={e.status === 'ANSWERED' ? 'success' : e.status === 'OPEN' ? 'neutral' : 'warn'}
                  text={e.status === 'OPEN' ? 'Awaiting reply' : e.status === 'ANSWERED' ? 'Answered' : 'Closed'} />
              </View>
            </Card>
          </Pressable>
        ))}
        <AppText role="small" tone="soft">{COPY.privacyPromise}</AppText>
        <View style={{ height: 20 }} />
      </View>
    </Screen>
  );
}
