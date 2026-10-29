// app/(consumer)/intent.tsx — ✦ slot: Consult explainer + gate (anon) / 4-step request wizard
// (client) per 03-discover… no — 04-book/00 L1. One route, internal step state (M1 simplification,
// documented in the register). Submits real createBookingRequest with a fresh idempotency_key.
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';

import * as db from '../../lib/db';
import { CLINIC, COPY, HOW_IT_WORKS, requestKindWord } from '../../lib/content';
import { penceToLabel } from '../../lib/format';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../theme/ThemeContext';
import { AppText, Badge, Button, Card, Field, Screen, ScreenHeader } from '../../components/ui';
import { MediaHeader } from '../../components/ClinicImage';
import { SearchField } from '../../components/Domain';
import { visuals } from '../../theme/visuals';

function newKey(): string {
  return typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function'
    ? (crypto as any).randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

export default function Intent() {
  const { tier } = useAuth();
  return tier === 'anon' ? <ConsultTab /> : <RequestWizard />;
}

// ---------------------------------------------------------------- anon: ✦ Consult (U4 + W02)
function ConsultTab() {
  const router = useRouter();
  const { colors, spacing, radii } = useTheme();
  return (
    <Screen canvas="pearl" scroll
      footer={
        <View style={{ gap: 8 }}>
          <Button title="Create account" onPress={() => router.push('/sign-up')} full />
          <Button variant="secondary" title="I already have an account — sign in" onPress={() => router.push('/me')} full />
        </View>
      }>
      <MediaHeader visual={visuals.adviseMeCard} height={230} />
      <View style={{ padding: spacing.xxl, gap: spacing.md }}>
        <AppText role="h1">Start with a free consultation</AppText>
        <AppText role="body" tone="soft" style={{ lineHeight: 24 }}>
          Meet your therapist, discuss your goals and get a personalised plan — no obligation,
          no sales pressure. Our therapists are paid salaries, not commission.
        </AppText>
        <View style={{ backgroundColor: colors.rose, borderRadius: radii.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.goldLine }}>
          <AppText role="bodyMedium">✦ {COPY.freeConsultAndPatch}</AppText>
          <AppText role="small" tone="soft" style={{ marginTop: 6 }}>{COPY.patchWindow}</AppText>
        </View>
        {HOW_IT_WORKS.map(s => (
          <View key={s.n} style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.plum, alignItems: 'center', justifyContent: 'center' }}>
              <AppText canvas="gold" role="bodyMedium">{s.n}</AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText role="bodyMedium">{s.title}</AppText>
              <AppText role="small" tone="soft">{s.body}</AppText>
            </View>
          </View>
        ))}
        <AppText role="small" tone="soft">
          {COPY.privacyPromise} Prefer to call?{' '}
          <AppText role="small" style={{ color: colors.goldText }} onPress={() => void Linking.openURL(`tel:${CLINIC.phoneTel}`)}>{CLINIC.phoneDisplay}</AppText>
        </AppText>
        <View style={{ height: 30 }} />
      </View>
    </Screen>
  );
}

// ---------------------------------------------------------------- client: ✦ Request wizard (C2)
type Step = 1 | 2 | 3 | 4 | 5;
export function RequestWizard({ initialOpen }: { initialOpen?: boolean }) {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const { colors, spacing, radii, fonts, typography } = useTheme();
  const [step, setStep] = useState<Step>(1);
  const [kind, setKind] = useState<'TREATMENT' | 'CONSULTATION' | 'ADVISE_ME' | null>(null);
  const [treatment, setTreatment] = useState<any | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [band, setBand] = useState<'MORNING' | 'AFTERNOON' | 'EVENING' | null>(null);
  const [note, setNote] = useState('');
  const [remind, setRemind] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any | null>(null);
  const keyRef = React.useRef<string>(newKey());
  const [search, setSearch] = useState('');
  const [cats, setCats] = useState<any[]>([]);
  const [list, setList] = useState<any[]>([]);

  useEffect(() => { void db.getCategories().then(r => setCats(r.data ?? [])); }, []);
  useEffect(() => { void db.getTreatments().then(r => setList(r.data ?? [])); }, []);
  const catsById = useMemo(() => Object.fromEntries(cats.map(c => [c.id, c])), [cats]);

  const days = useMemo(() => {
    const out: { iso: string; label: string }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      out.push({
        iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
      });
    }
    return out;
  }, []);

  const submit = async () => {
    if (!user || !kind || !date) return;
    setSubmitting(true); setSubmitErr(null);
    const res = await db.createBookingRequest({
      clientUserId: user.id,
      clinicId: await db.clinicId(),
      requestKind: kind, treatmentId: kind === 'TREATMENT' ? treatment?.id : undefined,
      preferredDate: date, timeBand: band ?? undefined, notes: note.trim() || undefined,
      idempotencyKey: keyRef.current,
    });
    setSubmitting(false);
    if (res.error) { setSubmitErr(res.error); return; }
    setReceipt(res.data);
    if (remind) { void db.recordConsent({ userId: user.id, kind: 'NOTIFICATIONS', policyVersion: 'demo-2026-10', policyTextHash: 'demo'.padEnd(64, '0'), decision: 'GRANTED' }); }
    setStep(5);
    void refresh();
  };

  // ---- step 5: acknowledgement (04/01)
  if (step === 5) {
    return (
      <Screen canvas="pearl" scroll>
        <View style={{ alignItems: 'center', padding: spacing.xxl, paddingTop: spacing.xxxl }}>
          <View style={{ width: 74, height: 74, borderRadius: 37, borderWidth: 2, borderColor: colors.goldLine, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.plum }}>
            <AppText canvas="gold" role="h1">✓</AppText>
          </View>
          <AppText role="h1" style={{ marginTop: spacing.lg }}>Your request is in</AppText>
        </View>
        <View style={{ paddingHorizontal: spacing.xxl }}>
          <View style={{ backgroundColor: colors.white, borderRadius: radii.md, borderWidth: 1, borderColor: colors.goldLine, padding: spacing.lg }}>
            <AppText role="body" style={{ fontStyle: 'italic', fontFamily: fonts.display, fontSize: 18, lineHeight: 26 }}>
              “{COPY.oneWorkingDay}”
            </AppText>
          </View>
          <View style={{ backgroundColor: colors.pearl, borderRadius: radii.md, padding: spacing.lg, marginTop: spacing.md, gap: 4 }}>
            <AppText role="bodyMedium">{kind === 'TREATMENT' ? treatment?.name : requestKindWord(kind ?? '')}</AppText>
            <AppText role="small" tone="soft">{days.find(d => d.iso === date)?.label ?? date} · {band ? band.toLowerCase() : 'any time'}</AppText>
            <AppText role="small" tone="accent">{COPY.notYetBooked}</AppText>
          </View>
          <AppText role="small" tone="soft" style={{ marginTop: spacing.md }}>
            The clinic sees it in their queue the moment you send it.{remind ? ' Reminders will land 24 h before confirmed visits.' : ''}
          </AppText>
          <View style={{ marginTop: spacing.xl, gap: 8 }}>
            <Button title="See my requests" variant="secondary" onPress={() => router.replace('/requests')} full />
            <Button title="Done" variant="quiet" onPress={() => router.replace('/')} full />
          </View>
        </View>
        <View style={{ height: 40 }} />
      </Screen>
    );
  }

  return (
    <Screen canvas="pearl" keyboard scroll footer={
      <Button title={step === 4 ? 'Confirm ✦' : 'Next'} full disabled={!canNext(step, kind, treatment, date)} loading={submitting} onPress={() => {
        if (step === 4) void submit(); else setStep(step === 2 && kind !== 'TREATMENT' ? 3 : (step + 1) as Step);
      }} />
    }>
      <ScreenHeader title={step === 1 ? 'Request' : step === 2 ? 'Which treatment?' : step === 3 ? 'When suits you?' : 'Review'}
        onBack={step > 1 ? () => setStep((step - 1) as Step) : undefined} />
      {/* progress dots */}
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
        {[1, 2, 3, 4].map(n => (
          <View key={n} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: n <= step ? colors.gold1 : colors.rose }} />
        ))}
      </View>
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
        {submitErr ? (
          <Card style={{ borderColor: colors.danger, borderWidth: 1 }}>
            <AppText tone="danger">⚠ Your request may not have reached the clinic.</AppText>
            <AppText role="small" tone="soft">Tap “Confirm” again — your request won’t be sent twice.</AppText>
          </Card>
        ) : null}

        {step === 1 ? (
          <>
            <AppText role="h3" style={{ marginBottom: 6 }}>What do you want to start?</AppText>
            {[
              { k: 'ADVISE_ME', title: COPY.adviseMe, sub: 'Not sure what suits you? We’ll advise — this is the site’s own first option.' },
              { k: 'CONSULTATION', title: 'A free consultation', sub: '20 minutes, no obligation, patch test included.' },
              { k: 'TREATMENT', title: 'A specific treatment', sub: 'Pick from the clinic list — you’ll still start with a consultation.' },
            ].map(o => (
              <Pressable key={o.k} onPress={() => { setKind(o.k as any); if (o.k !== 'TREATMENT') setTreatment(null); }}>
                <Card style={{ borderColor: kind === o.k ? colors.gold1 : colors.rose, borderWidth: kind === o.k ? 2 : 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: kind === o.k ? colors.gold1 : colors.mutedNight, alignItems: 'center', justifyContent: 'center' }}>
                      {kind === o.k ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold1 }} /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText role="bodyMedium">{o.title}</AppText>
                      <AppText role="small" tone="soft">{o.sub}</AppText>
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))}
          </>
        ) : null}

        {step === 2 ? (
          <>
            <SearchField value={search} onChange={setSearch} />
            <View style={{ height: 4 }} />
            <ScrollView style={{ maxHeight: 380 }}>
              {list.filter(t => !search.trim() || t.name.toLowerCase().includes(search.toLowerCase())).map(t => (
                <Pressable key={t.id} onPress={() => setTreatment(t)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.pearl, gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <AppText role="bodyMedium">{t.name}</AppText>
                      <AppText role="caption" tone="soft">{catsById[t.category_id]?.name ?? ''}</AppText>
                    </View>
                    <AppText role="small" tone="accent">{penceToLabel(t.price_from_pence, t.pricing_model)}</AppText>
                    {treatment?.id === t.id ? <Badge text="✓" tone="gold" /> : null}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <AppText role="small" tone="soft" style={{ marginBottom: 6 }}>Preferred day — the clinic confirms the exact time by phone.</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 6 }}>
              {days.map(d => (
                <Pressable key={d.iso} onPress={() => setDate(d.iso)}>
                  <View style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: radii.sm, borderWidth: date === d.iso ? 2 : 1, borderColor: date === d.iso ? colors.gold1 : colors.rose, backgroundColor: date === d.iso ? colors.plumDeep : colors.white }}>
                    <AppText role="small" canvas={date === d.iso ? 'night' : 'light'}>{d.label}</AppText>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
            <AppText role="small" tone="soft" style={{ marginTop: spacing.lg, marginBottom: 6 }}>Time of day</AppText>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['MORNING', 'AFTERNOON', 'EVENING'] as const).map(b => (
                <Pressable key={b} onPress={() => setBand(band === b ? null : b)} style={{ flex: 1 }}>
                  <View style={{ paddingVertical: 12, borderRadius: radii.sm, borderWidth: band === b ? 2 : 1, borderColor: band === b ? colors.gold1 : colors.rose, alignItems: 'center' }}>
                    <AppText role="small">{b[0] + b.slice(1).toLowerCase()}</AppText>
                  </View>
                </Pressable>
              ))}
            </View>
            <View style={{ marginTop: spacing.lg }}>
              <Field label="Anything the clinic should know? (optional)" value={note} onChange={setNote} multiline
                helper="ⓘ Please don’t include medical details — that’s discussed at your consultation." />
            </View>
          </>
        ) : null}

        {step === 4 ? (
          <Card>
            <AppText role="h3" style={{ marginBottom: 8 }}>Review</AppText>
            <AppText role="bodyMedium">{kind === 'TREATMENT' ? treatment?.name : requestKindWord(kind ?? '')}</AppText>
            <AppText role="small" tone="soft">{days.find(d => d.iso === date)?.label ?? '—'} · {band ? band.toLowerCase() : 'any time'}</AppText>
            {note.trim() ? <AppText role="small" tone="soft" style={{ marginTop: 6 }}>Note: “{note.trim()}”</AppText> : null}
            <Pressable onPress={() => setRemind(!remind)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md }}>
              <View style={{ width: 20, height: 20, borderRadius: 5, borderWidth: 1, borderColor: remind ? colors.gold1 : colors.mutedNight, backgroundColor: remind ? colors.gold1 : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {remind ? <AppText role="small" canvas="night">✓</AppText> : null}
              </View>
              <AppText role="small">Remind me (push, 24 h before visits)</AppText>
            </Pressable>
            <AppText role="caption" tone="soft" style={{ marginTop: 10 }}>
              This sends a REQUEST — {COPY.oneWorkingDay.toLowerCase()}
            </AppText>
          </Card>
        ) : null}
        <View style={{ height: 20 }} />
      </View>
    </Screen>
  );
}

function canNext(step: Step, kind: string | null, treatment: any, date: string | null): boolean {
  if (step === 1) return !!kind;
  if (step === 2) return !!treatment;
  if (step === 3) return !!date;
  return true;
}
