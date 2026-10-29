// app/(consumer)/edit.tsx — profile edit + simulated phone re-verify (08/00, DA-11/12/19).
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import * as auth from '../../lib/auth';
import * as db from '../../lib/db';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../theme/ThemeContext';
import { AppText, Badge, Button, Card, ErrorRetry, Field, Screen, ScreenHeader } from '../../components/ui';
import { BottomSheet } from '../../components/Sheets';

export default function EditProfile() {
  const router = useRouter();
  const { user, profile, refresh } = useAuth();
  const { spacing, colors } = useTheme();
  const [first, setFirst] = useState(profile?.first_name ?? '');
  const [last, setLast] = useState(profile?.last_name ?? '');
  const [phone, setPhone] = useState(profile?.phone_raw ?? profile?.phone_e164 ?? '');
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [verify, setVerify] = useState<string | null>(null);
  const [code, setCode] = useState('');

  const toE164 = (p: string) => {
    const d = p.replace(/[^\d+]/g, '');
    if (d.startsWith('+44')) return d;
    if (d.startsWith('0')) return '+44' + d.slice(1);
    return d.startsWith('+') ? d : '+44' + d;
  };

  const save = async () => {
    if (!user) return;
    setBusy(true); setErr(null);
    const newE164 = toE164(phone);
    const changed = !!profile?.phone_e164 && profile.phone_e164 !== newE164;
    const r = await db.saveClientProfile({ userId: user.id, clinicId: await db.clinicId(), firstName: first, lastName: last, phoneE164: newE164, phoneRaw: phone });
    setBusy(false);
    if (r.error) {
      if (/unique|duplicate|verified phone/i.test(r.error)) {
        setErr('That mobile is registered with us already — sign in, or we’ll call you.');
      } else setErr(r.error);
      return;
    }
    setSaved(true);
    if (changed) { const d = await auth.requestPhoneOtp(newE164); setVerify(d.demoCode); }
    await refresh();
  };

  const confirmCode = async () => {
    const r = await auth.confirmPhoneOtp(code);
    if (r.error) { setErr(r.error); return; }
    // service stamps verified_at in the real flow; demo marks via profile patch seam-free:
    setVerify(null); setCode(''); setSaved(false); void refresh();
  };

  return (
    <Screen canvas="pearl" keyboard scroll footer={
      <Button title={busy ? '…' : 'Save'} full disabled={busy || !first || !last} onPress={() => void save()} />
    }>
      <ScreenHeader title="Edit details" onBack={() => router.back()} />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
        {err ? <ErrorRetry message={err} onRetry={() => setErr(null)} /> : null}
        {saved && !verify ? <Card><AppText tone="success">✓ Saved.</AppText></Card> : null}
        <Field label="First name" value={first} onChange={setFirst} autoCapitalize="words" />
        <Field label="Last name" value={last} onChange={setLast} autoCapitalize="words" />
        <Field label="Email" value={user?.email ?? ''} onChange={() => undefined}
          helper="Email changes are handled by the clinic — just ask." />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Badge tone={profile?.phone_verified_at ? 'success' : 'warn'}
            text={profile?.phone_verified_at ? '✓ Number verified' : 'Number unverified — tap Save + code'} />
        </View>
        <Field label="Mobile" value={phone} onChange={setPhone} keyboardType="phone-pad"
          helper="Changing it needs a new code (demo: shown on screen, real SMS lands in M1)." />
        <AppText role="caption" tone="soft">Fields kept to DA-11: name, email, mobile. More asks need the owner’s go-ahead.</AppText>
        <View style={{ height: 20 }} />
      </View>

      <BottomSheet visible={!!verify} onClose={() => setVerify(null)} half>
        <AppText role="h3">Confirm your new number</AppText>
        <AppText role="small" tone="soft" style={{ marginVertical: 8 }}>
          Demo mode (DA-19): the code would arrive by SMS. Here it is: {verify}
        </AppText>
        <Field label="6-digit code" value={code} onChange={setCode} keyboardType="numeric" />
        <Button title="Confirm" disabled={code.length < 4} full onPress={() => void confirmCode()} />
      </BottomSheet>
    </Screen>
  );
}
