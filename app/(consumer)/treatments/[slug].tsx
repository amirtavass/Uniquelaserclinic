// app/(consumer)/treatments/[slug].tsx — treatment detail (03-discover/01 L1, locked).
// Missing values render "Discussed at consultation" — never invented (S04 AC / V2 §11).
import { useAuth } from '../../../providers/AuthProvider';
import React, { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import * as db from '../../../lib/db';
import { CLINIC, COPY } from '../../../lib/content';
import { penceToLabel } from '../../../lib/format';
import { useTheme } from '../../../theme/ThemeContext';
import { AppText, Badge, Button, Card, EmptyState, Eyebrow, Screen } from '../../../components/ui';
import { MediaHeader } from '../../../components/ClinicImage';
import { visualForTreatment } from '../../../theme/visuals';

export default function TreatmentDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { tier } = useAuth();
  const { colors, spacing, radii } = useTheme();
  const [row, setRow] = useState<any | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading');

  useEffect(() => {
    let alive = true;
    db.getTreatmentBySlug(slug ?? '').then(r => {
      if (!alive) return;
      if (r.data) { setRow(r.data); setState('ok'); } else setState('missing');
    });
    return () => { alive = false; };
  }, [slug]);

  if (state === 'loading') return <Screen><EmptyState title="Loading…" /></Screen>;
  if (state === 'missing') {
    return (
      <Screen>
        <EmptyState icon="⚠" title="We can’t show that page right now"
          lines={['It may have changed.']} actionLabel="Browse all treatments"
          onAction={() => router.replace('/treatments')} />
      </Screen>
    );
  }

  const banner = visualForTreatment(row.slug, row.treatment_categories?.slug, true) ?? visualForTreatment(row.slug, row.treatment_categories?.slug);
  const sessions = row.typical_sessions_min
    ? `Usually ${row.typical_sessions_min}${row.typical_sessions_max && row.typical_sessions_max !== row.typical_sessions_min ? `–${row.typical_sessions_max}` : ''} sessions`
    : COPY.discussedAtConsultation;
  const pkg = (row.course_packages ?? []).find((p: any) => p.published !== false);

  const onStart = () => {
    if (tier === 'anon') router.push('/intent'); // ✦ Consult tab hosts the gate (04/00 intro)
    else router.push('/intent');                 // client → wizard
  };

  return (
    <Screen canvas="white" scroll
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Button variant="secondary" title="Call" onPress={() => void Linking.openURL(`tel:${CLINIC.phoneTel}`)} full />
          </View>
          <View style={{ flex: 2.2 }}>
            <Button title="✦ Book free consultation" onPress={onStart} full />
          </View>
        </View>
      }>
      <MediaHeader visual={banner} height={220} />
      <View style={{ padding: spacing.xxl, gap: spacing.sm }}>
        <Eyebrow text={`${row.treatment_categories?.name ?? 'TREATMENT'} · ${row.slug.replace(/-/g, ' ')}`.toUpperCase()} />
        <AppText role="h1">{row.name}</AppText>
        <AppText role="h2" style={{ color: colors.goldText }}>{penceToLabel(row.price_from_pence, row.pricing_model)}</AppText>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
          <Badge text={sessions} />
          <Badge text={row.duration_minutes ? `~${row.duration_minutes} min` : COPY.discussedAtConsultation} />
        </View>

        {row.summary ? <AppText role="body" tone="soft" style={{ marginTop: 8, lineHeight: 24 }}>{row.summary}</AppText> : null}
        {row.description ? <AppText role="body" style={{ marginTop: 10, lineHeight: 24 }}>{row.description}</AppText> : null}

        {/* rose promise card (W02) */}
        <View style={{ backgroundColor: colors.rose, borderRadius: radii.md, padding: spacing.lg, marginTop: spacing.lg, borderWidth: 1, borderColor: colors.goldLine }}>
          <AppText role="bodyMedium">✦ {COPY.freeConsultAndPatch}</AppText>
          <AppText role="small" tone="soft" style={{ marginTop: 6 }}>{COPY.patchWindow}</AppText>
          {pkg ? (
            <AppText role="small" style={{ marginTop: 8, color: colors.goldText }}>
              Course: {pkg.name} — {pkg.sessions_count} sessions · {pkg.discount_percent}% off · {penceToLabel(pkg.price_pence, 'PRICE_ON_CONSULTATION')}
            </AppText>
          ) : null}
        </View>

        {row.disclaimer ? <AppText role="small" tone="soft" style={{ marginTop: spacing.lg, fontStyle: 'italic' }}>ⓘ {row.disclaimer}</AppText> : null}

        <Card style={{ marginTop: spacing.lg }}>
          <AppText role="bodyMedium">Questions about this treatment?</AppText>
          <AppText role="small" tone="soft">Ask the clinic — replies come to your inbox in the app.</AppText>
          <View style={{ marginTop: spacing.sm }}>
            <Button variant="ghost" title={COPY.askAdvice} onPress={onStart} full />
          </View>
        </Card>
        <View style={{ height: 12 }} />
      </View>
    </Screen>
  );
}
