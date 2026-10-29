// app/(consumer)/index.tsx — 🏠 Home: ONE slot, two roles, zero layout jump (02-navigation §3).
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Image, View } from 'react-native';

import * as db from '../../lib/db';
import { CLINIC, COPY, HOW_IT_WORKS, appointmentTypeWord } from '../../lib/content';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../theme/ThemeContext';
import { AppText, Badge, Button, Card, CountBadge, ErrorRetry, Eyebrow, GoldRule, ListSkeleton, OfflineBanner, Screen, SectionHead } from '../../components/ui';
import { ClinicImage, aspect } from '../../components/ClinicImage';
import { ChainStepper, OpenClosedChip, TreatmentCard } from '../../components/Domain';
import { visuals } from '../../theme/visuals';
import { fmtDateTime, relativeDayLabel } from '../../lib/format';

export default function Home() {
  const { tier } = useAuth();
  return tier === 'anon' ? <GuestHome /> : <ClientHome />;
}

// ---------------------------------------------------------------- guest (02-home/00 L1)
function GuestHome() {
  const router = useRouter();
  const { colors, spacing, radii } = useTheme();
  const [hours, setHours] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [concerns, setConcerns] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[] | null>(null);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [fail, setFail] = useState(false);
  const [openFee, setOpenFee] = useState<string | null>(null);

  const load = () => Promise.all([
    db.getOpeningStatus(), db.getCategories(), db.getConcerns(),
    db.getTreatments().then(r => r.data?.filter(t => t.is_featured) ?? null), db.getFaqItems(),
  ]).then(([h, c, k, f, q]) => {
    setHours(h.data ?? []); setCats(c.data ?? []); setConcerns(k.data ?? []); setFeatured(f ?? []); setFaqs(q.data ?? []);
  }).catch(() => setFail(true));
  useEffect(() => { void load(); }, []);

  const catsById = Object.fromEntries(cats.map(c => [c.id, c]));

  return (
    <Screen canvas="night" scroll contentStyle={{}}>
      {/* NIGHT HERO */}
      <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.md, paddingBottom: spacing.xxl }}>
        <Image source={visuals.logo} style={{ width: 150, height: 73, marginBottom: spacing.sm }} resizeMode="contain" />
        <Eyebrow text="LASER CLINIC · BOLTON" canvas="night" style={{ marginTop: 6 }} />
        <AppText role="display" canvas="night" style={{ marginTop: 8, fontFamily: 'Cormorant_500Medium' }}>
          Reveal your unique.
        </AppText>
        <AppText role="body" canvas="night" tone="soft" style={{ marginTop: 8, lineHeight: 23 }}>
          A laser, skin & body clinic at {CLINIC.address}. Women and men across Bolton and Greater
          Manchester — medical-grade lasers, honest advice, no hard sell.
        </AppText>
        {hours.length ? <View style={{ marginTop: spacing.lg }}><OpenClosedChip rows={hours} /></View> : null}
        <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
          <Button title={COPY.bookFreeConsult} onPress={() => router.push('/intent')} full />
          <Button title={COPY.exploreTreatments} variant="ghost" onPress={() => router.push('/treatments')} full />
          <Button variant="quiet" title={`Or call us directly: ${CLINIC.phoneDisplay}`} onPress={() => void Linking.openURL(`tel:${CLINIC.phoneTel}`)} full />
        </View>
      </View>

      <OfflineBanner cached={!featured} />

      {/* CONCERN PILLS — the U1 question as a row */}
      {concerns.length ? (
        <View style={{ backgroundColor: colors.night, paddingBottom: spacing.md, paddingTop: spacing.sm }}>
          <Eyebrow text="WHAT TROUBLES YOU?" canvas="night" style={{ marginBottom: 10, paddingHorizontal: spacing.lg }} />
          <NightPills concerns={concerns} onPress={c => router.push({ pathname: '/treatments', params: { concern: c } })} />
        </View>
      ) : null}

      {/* FEATURED TREATMENTS */}
      <View style={{ backgroundColor: colors.pearl, paddingTop: spacing.xxl }}>
        <SectionHead title="Laser treatments we offer" right="See all" onRight={() => router.push('/treatments')} />
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
          {featured === null ? <ListSkeleton n={2} />
            : fail ? <ErrorRetry onRetry={load} extraLabel={`Call ${CLINIC.phoneDisplay}`} onExtra={() => void Linking.openURL(`tel:${CLINIC.phoneTel}`)} />
              : featured.map(t => (
                <TreatmentCard key={t.id} t={t} catsById={catsById} onPress={() => router.push(`/treatments/${t.slug}`)} />
              ))}
        </View>

        {/* HOW IT WORKS — rose band */}
        <View style={{ backgroundColor: colors.rose, marginTop: spacing.lg, paddingVertical: spacing.xxl }}>
          <Eyebrow text="HOW IT WORKS" style={{ paddingHorizontal: spacing.lg, marginBottom: 6 }} />
          <View style={{ paddingHorizontal: spacing.lg }}>
            <AppText role="h2">Your journey, from booking to results</AppText>
          </View>
          <View style={{ paddingHorizontal: spacing.lg, gap: 14, marginTop: spacing.lg }}>
            {HOW_IT_WORKS.map(s => (
              <View key={s.n} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.plum, alignItems: 'center', justifyContent: 'center' }}>
                  <AppText canvas="gold" role="bodyMedium">{s.n}</AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText role="bodyMedium">{s.title}</AppText>
                  <AppText role="small" tone="soft">{s.body}</AppText>
                </View>
              </View>
            ))}
          </View>
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
            <Pressable onPress={() => router.push('/intent')}>
              <ClinicImage visual={visuals.consultBanner} ratio={aspect.wide} radius={radii.md} />
            </Pressable>
          </View>
        </View>

        {/* FAQ + CONTACT */}
        <View style={{ paddingVertical: spacing.xxl }}>
          <SectionHead title="Questions?" right="All FAQs" onRight={() => router.push('/intent')} />
          <View style={{ paddingHorizontal: spacing.lg, gap: 10, marginTop: spacing.sm }}>
            {faqs.slice(0, 3).map(f => (
              <Card key={f.id}>
                <Pressable onPress={() => setOpenFee(openFee === f.id ? null : f.id)}>
                  <AppText role="bodyMedium">{f.question}</AppText>
                  {openFee === f.id ? <AppText role="small" tone="soft" style={{ marginTop: 6 }}>{f.answer}</AppText> : null}
                </Pressable>
              </Card>
            ))}
          </View>
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
            <Card canvas="night">
              <Eyebrow text="VISIT US" canvas="night" />
              <AppText role="h3" canvas="night" style={{ marginTop: 6 }}>{CLINIC.address}</AppText>
              <ClinicImage visual={visuals.clinicOffice} ratio={aspect.wide} radius={radii.md} style={{ marginTop: 12 }} />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <View style={{ flex: 1 }}><Button title="Directions" variant="ghost" onPress={() => void Linking.openURL(CLINIC.mapUrl)} full /></View>
                <View style={{ flex: 1 }}><Button title="Call" variant="secondary" onPress={() => void Linking.openURL(`tel:${CLINIC.phoneTel}`)} full /></View>
              </View>
              <View style={{ marginTop: 10, flexDirection: 'row', gap: 10, alignItems: 'center' }}><GoldRule />
                <AppText role="small" canvas="night" tone="soft">{COPY.openSeven}</AppText></View>
            </Card>
          </View>
          <View style={{ height: 40 }} />
        </View>
      </View>
    </Screen>
  );
}

function NightPills({ concerns, onPress }: { concerns: any[]; onPress: (slug: string) => void }) {
  const { colors, radii, fonts, typography } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
      {concerns.map(c => (
        <Pressable key={c.id} onPress={() => onPress(c.slug)} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.gold1 }}>
          <AppText role="small" canvas="night" style={{ fontFamily: fonts.bodyMedium }}>{c.name}</AppText>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------- client (02-home/01 L1)
function ClientHome() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { colors, spacing, radii } = useTheme();
  const [dash, setDash] = useState<any | null>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([db.myDashboard(), db.getPublishedUpdates()]).then(([d, u]) => {
      if (d.error) { setErr(d.error); } else { setDash(d.data); setErr(null); }
      setUpdates(u.data ?? []);
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, [user?.id]);
  useEffect(() => { const t = setInterval(() => { /* keep fresh while open */ }, 30000); return () => clearInterval(t); }, []);

  const first = dash?.upcoming_appointments?.[0];
  const chain = dash?.upcoming_appointments ?? [];

  return (
    <Screen canvas="pearl">
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
        <View>
          <Eyebrow text={relativeDayLabel(new Date().toISOString().slice(0, 10)).toUpperCase()} />
          <AppText role="h2">{profile?.first_name ? `Hello, ${profile.first_name}` : 'Hello'}</AppText>
        </View>
        <Pressable onPress={() => router.push('/updates')} hitSlop={10} style={{ position: 'relative' }}>
          <AppText role="h3" tone="soft">🔔</AppText>
          <View style={{ position: 'absolute', top: -4, right: -6 }}><CountBadge n={dash?.unread_updates ?? 0} /></View>
        </Pressable>
      </View>

      {err ? <ErrorRetry message="Couldn’t load your dashboard." onRetry={load} extraLabel={`Call ${CLINIC.phoneDisplay}`} onExtra={() => void Linking.openURL(`tel:${CLINIC.phoneTel}`)} /> : null}
      {loading && !dash ? <ListSkeleton n={3} /> : null}

      {!err && dash ? (
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {first ? (
            <Pressable onPress={() => router.push(`/appointments/${first.id}`)}>
              <Card canvas="night" style={{ padding: 0 }}>
                <View style={{ padding: spacing.lg }}>
                  <Eyebrow text="YOUR NEXT VISIT" canvas="night" />
                  <AppText role="h2" canvas="night" style={{ marginTop: 6 }}>{appointmentTypeWord(first.type)}
                    {first.type === 'PATCH_TEST' ? ' due before your first session' : ''}</AppText>
                  <AppText role="body" canvas="night" tone="soft">{fmtDateTime(first.scheduled_start)}</AppText>
                  <View style={{ marginTop: spacing.sm }}><Badge tone="gold" text={first.status === 'SCHEDULED' ? 'Confirmed' : first.status.toLowerCase()} /></View>
                  <View style={{ marginTop: spacing.md, backgroundColor: colors.night2, borderRadius: radii.sm, paddingVertical: 10, paddingHorizontal: 8 }}>
                    <ChainStepper appts={chain} />
                  </View>
                </View>
              </Card>
            </Pressable>
          ) : (
            <Card>
              <AppText role="h3">✨ You’re all set up</AppText>
              <AppText role="small" tone="soft" style={{ marginTop: 6 }}>
                Nothing booked yet — the clinic confirms requests within one working day.
              </AppText>
              <View style={{ marginTop: spacing.md }}><Button title="✦ Request an appointment" onPress={() => router.push('/intent')} /></View>
              <Button variant="quiet" title={`${COPY.askAdvice} — no obligation`} onPress={() => router.push('/enquiries')} />
            </Card>
          )}

          {dash.pending_requests > 0 ? (
            <Pressable onPress={() => router.push('/requests')}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold1 }} />
                <AppText role="bodyMedium" style={{ flex: 1 }}>{dash.pending_requests} request{dash.pending_requests > 1 ? 's' : ''} awaiting confirmation</AppText>
                <AppText tone="soft">›</AppText>
              </Card>
            </Pressable>
          ) : null}

          {updates.length ? (
            <Pressable onPress={() => router.push('/updates')}>
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Eyebrow text={dash.unread_updates > 0 ? `NEW UPDATE · ${dash.unread_updates} UNREAD` : 'CLINIC UPDATE'} />
                </View>
                <AppText role="bodyMedium" style={{ marginTop: 6 }} numberOfLines={2}>“{updates[0]?.title}”</AppText>
              </Card>
            </Pressable>
          ) : null}

          {dash.open_enquiries > 0 ? (
            <Pressable onPress={() => router.push('/enquiries')}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <AppText style={{ flex: 1 }}>💬 {dash.open_enquiries} conversation{dash.open_enquiries > 1 ? 's' : ''} with the clinic</AppText>
                <AppText tone="soft">›</AppText>
              </Card>
            </Pressable>
          ) : null}

          <Button variant="secondary" title="✦ Request an appointment" onPress={() => router.push('/intent')} full />
          <View style={{ height: 20 }} />
        </View>
      ) : null}
    </Screen>
  );
}
