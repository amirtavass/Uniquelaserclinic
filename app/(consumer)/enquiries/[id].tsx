// app/(consumer)/enquiries/[id].tsx — thread view + reply (append-only; RLS own-thread).
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import * as db from '../../../lib/db';
import { useTheme } from '../../../theme/ThemeContext';
import { AppText, Button, EmptyState, ErrorRetry, Field, Screen, ScreenHeader } from '../../../components/ui';
import { ThreadBubble } from '../../../components/Domain';

export default function EnquiryThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { spacing } = useTheme();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const r = await db.enquiryThread(id);
    if (r.error) setErr(r.error); else { setMsgs(r.data ?? []); setErr(null); }
  };
  useEffect(() => { void load(); }, [id]);
  useEffect(() => { const t = setInterval(() => { void load(); }, 8000); return () => clearInterval(t); }, [id]);

  const send = async () => {
    if (!draft.trim()) return;
    setBusy(true);
    const r = await db.replyEnquiry(id, draft.trim());
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    setDraft(''); void load();
  };

  return (
    <Screen canvas="pearl" scroll contentStyle={{ justifyContent: 'flex-end' }}>
      <ScreenHeader title="Conversation" onBack={() => router.back()} />
      {err ? <ErrorRetry message={err} onRetry={load} /> : null}
      {!msgs.length && !err ? <EmptyState title="Loading…" /> : null}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
        {msgs.map(m => <ThreadBubble key={m.id} msg={m} />)}
      </View>
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
        <Field label="Your reply" value={draft} onChange={setDraft} multiline placeholder="Type a message…" />
        <Button title={busy ? '…' : 'Send'} disabled={!draft.trim() || busy} onPress={() => void send()} full />
        <View style={{ height: 30 }} />
      </View>
    </Screen>
  );
}
