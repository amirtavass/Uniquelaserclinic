// app/admin/(tabs)/care.tsx — 💆 Care: answer enquiries (real, S13), publish/unpublish updates
// (real, S14), price & hours showcases (read-only, edits = M1.5 per demo directive §3.3).
import React, { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import * as db from '../../../lib/db';
import { CLINIC } from '../../../lib/content';
import { useAuth } from '../../../providers/AuthProvider';
import { useTheme } from '../../../theme/ThemeContext';
import { AppText, Badge, Button, Card, Divider, EmptyState, ErrorRetry, Eyebrow, Field, Screen, ScreenHeader } from '../../../components/ui';
import { ThreadBubble } from '../../../components/Domain';
import { computeOpenStatus } from '../../../lib/opening';

export default function Care() {
  const { spacing, colors } = useTheme();
  const { user } = useAuth();
  const [enqs, setEnqs] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [draft, setDraft] = useState('');
  const [updates, setUpdates] = useState<any[]>([]);
  const [hours, setHours] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState(''); const [newBody, setNewBody] = useState('');

  const load = async () => {
    const [e, u, h, p] = await Promise.all([db.staffEnquiries(), db.staffUpdatesAll(), db.getOpeningStatus(), db.staffTreatments()]);
    if (e.error || u.error) setErr(e.error ?? u.error ?? null);
    setEnqs(e.data ?? []); setUpdates(u.data ?? []); setHours(h.data ?? []); setPrices((p.data ?? []).filter(x => x.published));
  };
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!openId) { setMsgs([]); return; }
    void db.enquiryThread(openId).then(r => setMsgs(r.data ?? []));
  }, [openId]);

  const reply = async () => {
    if (!draft.trim() || !openId) return;
    const r = await db.staffReplyEnquiry(openId, draft.trim());
    if (r.error) setErr(r.error); else { setDraft(''); const t = await db.enquiryThread(openId); setMsgs(t.data ?? []); void load(); }
  };
  const setStatus = async (id: string, status: 'DRAFT' | 'PUBLISHED') => {
    const r = await db.publishUpdate(id, status);
    if (r.error) setErr(r.error);
    else { setToast(status === 'PUBLISHED' ? 'Live — clients get a generic bell (R06)' : 'Unpublished — history kept'); setTimeout(() => setToast(null), 2600); void load(); }
  };

  const status = computeOpenStatus(hours);
  return (
    <Screen canvas="pearl" scroll>
      <ScreenHeader title="Care" eyebrow="ENQUIRIES · UPDATES · CATALOGUE" />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        {err ? <ErrorRetry message={err} onRetry={load} /> : null}
        {toast ? <Card><AppText tone="success">✓ {toast}</AppText></Card> : null}

        <Eyebrow text="ENQUIRY THREADS" />
        {enqs.length === 0 ? <EmptyState icon="💬" title="No enquiries yet" lines={['They arrive when clients tap “Ask”.']} /> : null}
        {enqs.slice(0, 6).map(e => (
          <Card key={e.id}>
            <Pressable onPress={() => setOpenId(openId === e.id ? null : e.id)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AppText role="bodyMedium" style={{ flex: 1 }}>{e.client_name_snapshot ?? 'Client'}</AppText>
                <Badge tone={e.status === 'OPEN' ? 'warn' : e.status === 'ANSWERED' ? 'success' : 'neutral'} text={e.status === 'OPEN' ? 'awaiting reply' : e.status === 'ANSWERED' ? 'answered' : 'closed'} />
              </View>
            </Pressable>
            {openId === e.id ? (
              <View style={{ marginTop: spacing.md }}>
                {msgs.map(m => <ThreadBubble key={m.id} msg={{ ...m, author_role: m.author_role === 'STAFF' ? 'STAFF' : 'CLIENT' }} />)}
                <Field label="Reply (staff)" value={draft} onChange={setDraft} multiline placeholder="Plain, warm, in your clinic’s voice…" />
                <Button title="Send reply" disabled={!draft.trim()} onPress={() => void reply()} full />
              </View>
            ) : null}
          </Card>
        ))}

        <Divider />
        <Eyebrow text="CLINIC UPDATES (DRAFTS ARE VISIBLE TO STAFF ONLY — RLS)" />
        <Card>
          <Field label="New update title" value={newTitle} onChange={setNewTitle} />
          <Field label="Body" value={newBody} onChange={setNewBody} multiline />
          <Button variant="secondary" title="Publish now" disabled={!newTitle.trim() || !newBody.trim()} full
            onPress={async () => {
              const r = await db.createUpdate(newTitle.trim(), newBody.trim());
              if (r.error) setErr(r.error); else { setNewTitle(''); setNewBody(''); void load(); }
            }} />
        </Card>
        {updates.map(u => (
          <Card key={u.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AppText role="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>{u.title}</AppText>
              <Badge tone={u.status === 'PUBLISHED' ? 'success' : 'neutral'} text={u.status === 'PUBLISHED' ? 'live' : 'draft'} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              {u.status === 'DRAFT' ? <Button small title="Publish" onPress={() => void setStatus(u.id, 'PUBLISHED')} /> : <Button small variant="dangerText" title="Unpublish" onPress={() => void setStatus(u.id, 'DRAFT')} />}
            </View>
          </Card>
        ))}

        <Divider />
        <Eyebrow text="PRICES & HOURS (SHOWCASE — EDIT SCREENS ARE M1.5, Q09)" />
        <Card>
          <AppText role="bodyMedium">{status.open ? `● Open ${status.detail}` : `● ${status.label} · ${status.detail}`}</AppText>
          <AppText role="caption" tone="soft" style={{ marginTop: 4 }}>7 days · 10:00–18:00 (valid_from versioning) · edit via hours screen (M1.5)</AppText>
        </Card>
        {prices.slice(0, 4).map(p => (
          <Card key={p.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppText role="bodyMedium" style={{ flex: 1 }}>{p.name}</AppText>
              <AppText role="small" tone="accent">{p.price_from_pence != null ? `from £${p.price_from_pence / 100}` : 'price on consultation'}</AppText>
            </View>
          </Card>
        ))}
        <AppText role="caption" tone="soft">Price edits append `treatment_price_history` (R05) — the write form lands with the full build.</AppText>
        <Button variant="quiet" title={`Clinic line: ${CLINIC.phoneDisplay}`} onPress={() => void Linking.openURL(`tel:${CLINIC.phoneTel}`)} />
        <View style={{ height: 24 }} />
      </View>
    </Screen>
  );
}
