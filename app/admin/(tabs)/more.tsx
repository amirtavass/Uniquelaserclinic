// app/admin/(tabs)/more.tsx — ⋯ More: owner seats (S16/DA-01, cap 2) + GDPR deletion queue
// (S11/DA-17) + Switch to Client View + Sign out. OWNER-SECONDARY surfaces, showcase-wired
// where cheap (start review is real; execute uses the C19 confirm sheet; the typed-intent gate is M1.5 polish).
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import * as db from '../../../lib/db';
import { useAuth } from '../../../providers/AuthProvider';
import { useTheme } from '../../../theme/ThemeContext';
import { AppText, Badge, Button, Card, Divider, EmptyState, ErrorRetry, Eyebrow, Screen, ScreenHeader } from '../../../components/ui';
import { initials } from '../../../lib/format';
import { ConfirmSheet } from '../../../components/Sheets';

export default function More() {
  const { role, profile, user, signOut } = useAuth();
  const { spacing, colors } = useTheme();
  const isOwner = role === 'owner';
  const [seats, setSeats] = useState<any[] | null>(null);
  const [queue, setQueue] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [exec, setExec] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    if (!isOwner) { setSeats([]); setQueue([]); return; }
    const [s, d] = await Promise.all([db.staffSeats(), db.deletionQueue()]);
    if (s.error || d.error) { setErr(s.error ?? d.error ?? null); return; }
    setSeats(s.data ?? []);
    setQueue((d.data ?? []).filter(x => x.status === 'REQUESTED' || x.status === 'IN_REVIEW'));
  };
  useEffect(() => { void load(); }, [role]);

  const staffSeats = (seats ?? []).filter(s => s.role === 'staff');
  const capReached = staffSeats.length >= 2;

  const review = async (id: string) => { const r = await db.startDeletionReview(id); if (r.error) setErr(r.error); else void load(); };
  const execute = async () => {
    if (!exec) return;
    const r = await db.applyDeletion(exec);
    setExec(null);
    if (r.error) setErr(r.error); else { setToast('Pseudonymised — audited, history kept (ADR-005)'); setTimeout(() => setToast(null), 3200); void load(); }
  };

  return (
    <Screen canvas="night" scroll>
      <ScreenHeader title={isOwner ? 'Owner tools' : 'Workspace'} canvas="night" eyebrow="ADMIN · MORE" />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        {err ? <ErrorRetry message={err} onRetry={load} /> : null}
        {toast ? <Card canvas="night"><AppText canvas="night" tone="success">✓ {toast}</AppText></Card> : null}

        <Button variant="secondary" title="← Switch to Client View" full onPress={() => router.replace('/')} />
        <Card canvas="night">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.plumDeep, alignItems: 'center', justifyContent: 'center' }}>
              <AppText canvas="gold">{initials(profile?.first_name, profile?.last_name)}</AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText canvas="night" role="bodyMedium">{profile?.first_name ?? user?.email ?? 'Staff'} · {role.toUpperCase()}</AppText>
              <AppText canvas="night" role="caption" tone="soft">{isOwner ? 'Owner seat — can manage staff & deletions' : 'Staff seat — queue, dial, care'}</AppText>
            </View>
          </View>
        </Card>

        {isOwner ? (
          <>
            <Divider />
            <Eyebrow text="STAFF SEATS" canvas="night" />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <AppText canvas="night">{staffSeats.length} of 2 staff seats used</AppText>
              <Badge tone={capReached ? 'gold' : 'success'} text={capReached ? 'CAP 2/2' : 'OPEN'} />
            </View>
            {(seats ?? []).map(s => (
              <Card key={s.id} canvas="night">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: s.role === 'owner' ? colors.gold1 : colors.plumDeep, alignItems: 'center', justifyContent: 'center' }}>
                    <AppText role="small" canvas={s.role === 'owner' ? 'night' : 'gold'}>{initials(s.name?.first_name, s.name?.last_name)}</AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText canvas="night" role="bodyMedium">{[s.name?.first_name, s.name?.last_name].filter(Boolean).join(' ') || '—'}</AppText>
                    <AppText canvas="night" role="caption" tone="soft">{s.role.toUpperCase()} · granted {new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</AppText>
                  </View>
                  {s.role === 'owner' ? <Badge tone="gold" text="👑 OWNER" /> : <Badge text="staff" />}
                </View>
              </Card>
            ))}
            <Card canvas="night">
              <AppText canvas="night" role="small" tone="soft">Both staff seats are in use — the third grant is refused by the database
                (trigger `assert_staff_seat_cap`, P0001), not by the app. Free one first, or change
                clinic_settings.staff_seat_max with the owner (Q01).</AppText>
            </Card>

            <Divider />
            <Eyebrow text="GDPR DELETION QUEUE" canvas="night" />
            {queue && queue.length === 0 ? <EmptyState title="No deletion requests" /> : null}
            {(queue ?? []).map(d => (
              <Card key={d.id} canvas="night">
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <AppText canvas="night" role="bodyMedium">{[d.name?.first_name, d.name?.last_name].filter(Boolean).join(' ') || 'Former client'}</AppText>
                  <Badge tone={d.status === 'IN_REVIEW' ? 'gold' : 'warn'} text={d.status === 'REQUESTED' ? 'NEW REQUEST' : 'IN REVIEW'} />
                </View>
                <AppText canvas="night" role="caption" tone="soft">Asked {new Date(d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</AppText>
                {d.status === 'REQUESTED' ? (
                  <View style={{ marginTop: spacing.sm }}><Button small variant="ghost" title="Open review" onPress={() => void review(d.id)} /></View>
                ) : (
                  <View style={{ marginTop: spacing.sm }}>
                    <AppText canvas="night" role="caption" tone="soft">Pseudonymise: name & phone removed · history de-identified · tokens/reminders deleted · consents kept as evidence</AppText>
                    <Button small variant="dangerText" title="Execute pseudonymise…" onPress={() => setExec(d.id)} />
                  </View>
                )}
              </Card>
            ))}
          </>
        ) : (
          <Card canvas="night">
            <AppText canvas="night" role="small" tone="soft">Seats and the GDPR queue belong to the owner seat (RLS enforces it even if this screen were reached — R07).</AppText>
          </Card>
        )}

        <Divider />
        <Button variant="ghost" title="Sign out" full onPress={() => void signOut().then(() => router.replace('/'))} />
        <View style={{ height: 30 }} />
      </View>

      <ConfirmSheet visible={!!exec} onClose={() => setExec(null)} danger confirmLabel="Execute"
        onConfirm={() => void execute()} title="Pseudonymise this client?"
        lines={['This can’t be undone. Bookings remain as a de-identified record where the law lets us keep them (DA-17 / ADR-005).']} />
    </Screen>
  );
}
