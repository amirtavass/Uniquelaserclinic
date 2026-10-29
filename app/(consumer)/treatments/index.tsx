// app/(consumer)/treatments/index.tsx — 💆 Treatments (03-discover/00 L1, locked).
// Two filter axes (concern + category), live search, grouped browse when unfiltered,
// cached catalogue for offline, S09 "Ask us for advice" empty state.
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import * as db from '../../../lib/db';
import { COPY } from '../../../lib/content';
import { useTheme } from '../../../theme/ThemeContext';
import { AppText, EmptyState, Eyebrow, Screen, SectionHead } from '../../../components/ui';
import { FilterPillRow, SearchField, TreatmentCard } from '../../../components/Domain';
import { useCached } from '../../../lib/useCached';

export default function Treatments() {
  const router = useRouter();
  const params = useLocalSearchParams<{ concern?: string }>();
  const { spacing, colors } = useTheme();
  const [search, setSearch] = useState('');
  const [concern, setConcern] = useState<string>(params.concern ?? 'all');
  const [cat, setCat] = useState('all');

  useEffect(() => { if (params.concern) setConcern(params.concern); }, [params.concern]);

  const cats = useCached('categories', db.getCategories, { initial: [] });
  const concerns = useCached('concerns', db.getConcerns, { initial: [] });
  const all = useCached('treatments', db.getTreatments, { initial: [] });

  const catsById = useMemo(() => Object.fromEntries((cats.data ?? []).map(c => [c.id, c])), [cats.data]);

  // client-side filter over the cached catalogue (search mirrors getTreatments OR-logic)
  const rows = useMemo(() => {
    let list = all.data ?? [];
    if (cat !== 'all') list = list.filter(t => t.category_id === cat);
    if (concern !== 'all' && all.data) {
      // concern join needs the ids; refetch for the filtered axis (public read, cheap)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(t => t.name.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q));
    }
    return list;
  }, [all.data, cat, search, concern]);

  // concern filter: server query when active (links are server-side)
  const concernRows = useCached(concern !== 'all' ? `treatments:${concern}` : 'treatments:none',
    () => (concern === 'all' ? Promise.resolve({ data: null, error: null }) : db.getTreatments({ concernSlug: concern })),
    { initial: [] as any[] | null });
  const finalRows = concern === 'all' ? rows : (concernRows.data ?? rows);

  const grouped = concern === 'all' && cat === 'all' && !search.trim();
  const showOffline = (all.offline || concernRows.offline) && !concernRows.loading;

  const renderCard = (t: any) => (
    <TreatmentCard key={t.id} t={t} catsById={catsById} onPress={() => router.push(`/treatments/${t.slug}`)} />
  );

  return (
    <Screen canvas="pearl">
      <Eyebrow text="LASER · SKIN · BODY" style={{ paddingHorizontal: spacing.lg, paddingTop: 14 }} />
      <AppText role="h1" style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>Treatments</AppText>
      <SearchField value={search} onChange={setSearch} />
      <View style={{ height: 10 }} />
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.lg }}>
          <AppText role="caption" tone="soft" style={{ letterSpacing: 1 }}>CONCERN</AppText>
          <View style={{ flex: 1 }}>
            <FilterPillRow
              options={[{ key: 'all', label: 'All' }, ...(concerns.data ?? []).map(c => ({ key: c.slug, label: c.name }))]}
              value={concern} onChange={setConcern} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.lg }}>
          <AppText role="caption" tone="soft" style={{ letterSpacing: 1 }}>CATEGORY</AppText>
          <View style={{ flex: 1 }}>
            <FilterPillRow
              options={[{ key: 'all', label: 'All' }, ...(cats.data ?? []).map(c => ({ key: c.id, label: c.name }))]}
              value={cat} onChange={setCat} />
          </View>
        </View>
      </View>
      <View style={{ height: 12 }} />

      {all.error && !all.data ? (
        <EmptyState icon="⚠" title="Couldn’t load treatments" lines={['Try again, or call the clinic directly.']}
          actionLabel="Try again" onAction={all.refresh} />
      ) : grouped ? (
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <AppText role="small" tone="soft">{(all.data ?? []).length} treatments{(showOffline ? ' · offline copy' : '')}</AppText>
          {(cats.data ?? []).map(c => {
            const list = (all.data ?? []).filter(t => t.category_id === c.id);
            if (!list.length) return null;
            return (
              <View key={c.id}>
                <Eyebrow text={`${c.name.toUpperCase()} (${list.length})`} style={{ marginBottom: 8 }} />
                {list.map(renderCard)}
              </View>
            );
          })}
        </View>
      ) : (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <AppText role="small" tone="soft" style={{ marginBottom: spacing.md }}>
            {finalRows.length} {finalRows.length === 1 ? 'treatment' : 'treatments'}
            {concern !== 'all' ? ` for “${(concerns.data ?? []).find(c => c.slug === concern)?.name ?? ''}”` : ''}
            {showOffline ? ' · saved copy' : ''}
          </AppText>
          {finalRows.map(renderCard)}
          {!finalRows.length ? (
            <EmptyState icon="🤔"
              title={`No match for “${search || (concerns.data ?? []).find(c => c.slug === concern)?.name || 'that combination'}”`}
              lines={['Nothing exactly like that. We’ll point you in the right direction.']}
              actionLabel={COPY.askAdvice} onAction={() => router.push('/intent')}
              quietLabel="Browse all instead" onQuiet={() => { setSearch(''); setConcern('all'); setCat('all'); }} />
          ) : (
            <View style={{ backgroundColor: colors.white, borderRadius: 14, borderWidth: 1,
              borderColor: colors.rose, padding: spacing.lg, marginVertical: spacing.md }}>
              <AppText role="bodyMedium">Not sure this is the one?</AppText>
              <AppText role="small" tone="soft">Advice is free — {COPY.freeConsultAndPatch.toLowerCase()}</AppText>
              <View style={{ marginTop: 10 }}><EmptyAdviceHint onAsk={() => router.push('/intent')} /></View>
            </View>
          )}
        </View>
      )}
      <View style={{ height: 30 }} />
    </Screen>
  );
}

function EmptyAdviceHint({ onAsk }: { onAsk: () => void }) {
  const { colors, fonts, typography } = useTheme();
  return (
    <AppText role="small" style={{ color: colors.goldText, fontFamily: fonts.bodySemiBold, onPress: onAsk }}>
      Ask us for advice ›
    </AppText>
  );
}
