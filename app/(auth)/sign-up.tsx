// app/(auth)/sign-up.tsx — S01/01-auth: real email+password sign-up, profile + consent rows.
// Fields = DA-11 exactly (name/email/mobile); phone OTP simulated for demo (DA-19).
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, View } from 'react-native';

import * as auth from '../../lib/auth';
import * as db from '../../lib/db';
import { CLINIC } from '../../lib/content';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../theme/ThemeContext';
import { AppText, Button, Card, Field, LinkText, Screen, ScreenHeader, ToggleRow } from '../../components/ui';

export default function SignUp() {
  const router = useRouter();
  const { refresh } = useAuth();
  const { colors, spacing } = useTheme();
  const [first, setFirst] = useState(''); const [last, setLast] = useState('');
  const [email, setEmail] = useState(''); const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [marketing, setMarketing] = useState(false); const [remind, setRemind] = useState(true);
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);

  const toE164 = (p: string) => {
    const d = p.replace(/[^\d+]/g, '');
    if (d.startsWith('+44')) return d;
    if (d.startsWith('0')) return '+44' + d.slice(1);
    return d.startsWith('+') ? d : '+44' + d;
  };

  const submit = async () => {
    setBusy(true); setErr(null);
    const { user, error } = await auth.signUpWithPassword({ email, password, firstName: first, lastName: last, phone });
    if (error) { setBusy(false); setErr(error); return; }
    if (user) {
      const clinic = await db.getClinic();
      const e164 = toE164(phone);
      await db.saveClientProfile({ userId: user.id, clinicId: clinic.data?.id ?? '', firstName: first, lastName: last, phoneE164: e164, phoneRaw: phone });
      await db.recordConsent({ userId: user.id, kind: 'DATA_PROCESSING', policyVersion: 'demo-2026-10', policyTextHash: 'demo'.padEnd(64, '0'), decision: 'GRANTED' });
      if (marketing) await db.recordConsent({ userId: user.id, kind: 'MARKETING', policyVersion: 'demo-2026-10', policyTextHash: 'demo'.padEnd(64, '0'), decision: 'GRANTED' });
      if (remind) await db.recordConsent({ userId: user.id, kind: 'NOTIFICATIONS', policyVersion: 'demo-2026-10', policyTextHash: 'demo'.padEnd(64, '0'), decision: 'GRANTED' });
      // Demo mode: email confirmations may be off project-wide; treat as verified immediately so
      // the presentation flow never dead-ends on an inbox.
      await auth.signInWithPassword(email, password);
      await refresh();
      setBusy(false);
      router.replace('/');
    } else { setBusy(false); router.push('/verify-email'); }
  };

  return (
    <Screen canvas="pearl" keyboard scroll footer={<Button title={busy ? '…' : 'Create account'} full disabled={busy || !first || !email || !password || !phone} onPress={() => void submit()} />}>
      <ScreenHeader title="Create account" onBack={() => router.back()} />
      <View style={{ paddingHorizontal: spacing.lg, gap: 2 }}>
        <AppText role="small" tone="soft">Just what the clinic needs — nothing invented: first name, last name, email, mobile.</AppText>
        <View style={{ height: spacing.md }} />
        {err ? <Card style={{ marginBottom: spacing.md }}><AppText tone="danger">⚠ {err}</AppText></Card> : null}
        <Field label="First name" value={first} onChange={setFirst} autoCapitalize="words" />
        <Field label="Last name" value={last} onChange={setLast} autoCapitalize="words" />
        <Field label="Email" value={email} onChange={setEmail} keyboardType="email-address" />
        <Field label="Mobile" value={phone} onChange={setPhone} keyboardType="phone-pad" placeholder="07…" helper="We verify by code in the full app (demo: instant)." />
        <Field label="Password" value={password} onChange={setPassword} secure />
        <ToggleRow label="Push reminders before visits" value={remind} onChange={setRemind} />
        <ToggleRow label="Email me about offers" value={marketing} onChange={setMarketing} />
        <AppText role="small" tone="soft" style={{ marginTop: spacing.sm }}>
          By continuing you agree we store these details to run your appointments. <LinkText label="Privacy notice" onPress={() => void Linking.openURL(`${CLINIC.site}/privacy-policy/`)} />
        </AppText>
        <View style={{ height: 80 }} />
      </View>
    </Screen>
  );
}
