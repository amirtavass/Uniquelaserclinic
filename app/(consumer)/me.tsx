// app/(consumer)/me.tsx — 👤 slot: Sign In (anon) with one-tap Demo Presenter quick-login
// (demo directive §2.2) / Profile hub (client+). Sign-in form is REAL (lib/auth seam).
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import * as db from '../../lib/db';
import { CLINIC } from '../../lib/content';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../theme/ThemeContext';
import { AppText, Badge, Button, Card, Divider, Eyebrow, Field, Screen, ScreenHeader } from '../../components/ui';
import { Row } from '../../components/Domain';

const DEMO = [
  { title: 'Sign in as Client (Priya)', email: 'priya.demo@uniquelaser.test', password: 'DemoClient2026!' },
  { title: 'Sign in as Staff (Sam)', email: 'sam.demo@uniquelaser.test', password: 'DemoStaff2026!' },
  { title: 'Sign in as Owner (Ayesha)', email: 'ayesha.demo@uniquelaser.test', password: 'DemoOwner2026!' },
];

export default function Me() {
  const { tier } = useAuth();
  return tier === 'anon' ? <SignInView /> : <ProfileHub />;
}

function SignInView() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { colors, spacing } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [quick, setQuick] = useState(true);

  const go = async (e: string, p: string) => {
    setBusy(true); setErr(null);
    const r = await signIn(e, p);
    setBusy(false);
    if (r.error) setErr(r.error);
    else router.replace('/');
  };

  return (
    <Screen canvas="pearl" keyboard scroll>
      <ScreenHeader title="Welcome back" />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
        <Field label="Email" value={email} onChange={setEmail} keyboardType="email-address" placeholder="you@example.com" error={err && !email ? err : null} />
        <Field label="Password" value={password} onChange={setPassword} secure placeholder="••••••••" error={err && email ? err : null} />
        <Button title={busy ? '…' : 'Sign in'} full disabled={busy || !email || !password} onPress={() => void go(email, password)} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Button variant="quiet" title="Forgot details?" onPress={() => router.push('/forgot')} />
          <Button variant="quiet" title="Create account" onPress={() => router.push('/sign-up')} />
        </View>
        <AppText role="small" tone="soft" style={{ marginTop: 6 }}>
          Prefer a call? {CLINIC.phoneDisplay} — or tap “just looking” below and browse everything first.
        </AppText>

        {/* Demo Presenter Quick Sign-In — collapsible, one tap per tier */}
        <Card style={{ marginTop: spacing.lg }}>
          <Eyebrow text="DEMO PRESENTER QUICK SIGN-IN" />
          <AppText role="small" tone="soft" style={{ marginVertical: 6 }}>Mock clinic accounts (uniquelaser.test) — never real clients.</AppText>
          {quick ? (
            <View style={{ gap: 8 }}>
              {DEMO.map(d => (
                <Button key={d.email} small title={d.title} variant="secondary" full disabled={busy}
                  onPress={() => void go(d.email, d.password)} />
              ))}
              <Button variant="quiet" title="Collapse" onPress={() => setQuick(false)} />
            </View>
          ) : (
            <Button variant="quiet" title="Open demo accounts" onPress={() => setQuick(true)} />
          )}
        </Card>

        <Pressable onPress={() => router.replace('/')} style={{ marginVertical: spacing.lg, alignItems: 'center' }}>
          <AppText role="small" tone="accent">Just looking — back to browse</AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

function ProfileHub() {
  const router = useRouter();
  const { profile, role, user, signOut, tier } = useAuth();
  const { colors, spacing } = useTheme();
  const [counts, setCounts] = useState<any | null>(null);
  React.useEffect(() => { void db.myDashboard().then(r => setCounts(r.data)); }, [user?.id]);

  return (
    <Screen canvas="pearl" scroll>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.plum, alignItems: 'center', justifyContent: 'center' }}>
            <AppText canvas="gold" role="h2">{(profile?.first_name ?? '?')[0]}{(profile?.last_name ?? ' ')[0]}</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText role="h3">{profile?.first_name} {profile?.last_name}</AppText>
            <AppText role="small" tone="soft">{user?.email}</AppText>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
              <Badge tone={profile?.phone_verified_at ? 'success' : 'warn'} text={profile?.phone_verified_at ? '✓ Number verified' : 'Number unverified'} />
              {role !== 'client' ? <Badge tone="gold" text={role.toUpperCase()} /> : null}
            </View>
          </View>
        </View>
        <Divider />
        <Row label="My appointments" value={counts?.upcoming_appointments?.length ? `${counts.upcoming_appointments.length} upcoming` : undefined} onPress={() => router.push('/appointments')} />
        <Row label="My requests" value={counts?.pending_requests ? `${counts.pending_requests} pending` : undefined} onPress={() => router.push('/requests')} />
        <Row label="My questions" value={counts?.open_enquiries ? `${counts.open_enquiries} open` : undefined} onPress={() => router.push('/enquiries')} />
        <Row label="Clinic updates" value={counts?.unread_updates ? `${counts.unread_updates} unread` : undefined} onPress={() => router.push('/updates')} />
        <Divider />
        <Row label="Edit details" onPress={() => router.push('/edit')} />
        <Row label="Notifications & marketing" onPress={() => router.push('/consents')} />
        <Row label="Privacy notice & terms" onPress={() => void Linking.openURL(`${CLINIC.site}/privacy-policy/`)} />
        <Row label="Request data deletion" onPress={() => router.push('/deletion')} />
        {tier === 'admin' || role !== 'client' ? (
          <Row label="Staff workspace" sub="Queue, directory, diary and owner tools" onPress={() => router.push('/admin')} />
        ) : null}
        <Divider />
        <View style={{ paddingVertical: 8 }}>
          <Button variant="dangerText" title="Sign out" full onPress={() => void signOut().then(() => router.replace('/'))} />
        </View>
      </View>
    </Screen>
  );
}
