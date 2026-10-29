// components/Domain.tsx — composite domain bits (05-component-library §B).
import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useTheme } from '../theme/ThemeContext';
import { AppText, Badge, Button, Card, Divider, StatusDot } from './ui';
import { ClinicImage, aspect } from './ClinicImage';
import { visualForTreatment, visuals } from '../theme/visuals';
import { CLINIC, COPY, appointmentTypeWord } from '../lib/content';
import { penceToLabel } from '../lib/format';
import { computeOpenStatus, type HoursRow, type OverrideRow } from '../lib/opening';

export function TreatmentCard({ t, catsById, onPress, wide }: {
  t: any; catsById: Record<string, any>; onPress: () => void; wide?: boolean;
}) {
  const { colors, spacing } = useTheme();
  const visual = visualForTreatment(t.slug, t.category_id ? catsById[t.category_id]?.slug : null);
  const sessions = t.typical_sessions_min
    ? `Usually ${t.typical_sessions_min}${t.typical_sessions_max && t.typical_sessions_max !== t.typical_sessions_min ? `–${t.typical_sessions_max}` : ''} sessions`
    : COPY.discussedAtConsultation;
  return (
    <Pressable onPress={onPress} style={{ marginBottom: spacing.md }}>
      <Card style={{ padding: 0 }}>
        <ClinicImage visual={visual} ratio={aspect.card} radius={0} scrim />
        <View style={{ padding: spacing.lg, gap: 6 }}>
          <AppText role="h3">{t.name}{t.is_featured ? '  ★' : ''}</AppText>
          <AppText role="small" tone="soft" numberOfLines={2}>{t.summary}</AppText>
          <AppText role="small" tone="soft">{sessions}</AppText>
          <AppText role="bodyMedium" tone="accent">{penceToLabel(t.price_from_pence, t.pricing_model)}</AppText>
        </View>
      </Card>
    </Pressable>
  );
}

export function FilterPillRow({ options, value, onChange }: {
  options: { key: string; label: string }[]; value: string; onChange: (k: string) => void;
}) {
  const { colors, radii, spacing, fonts, typography } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
      {options.map(o => {
        const on = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)}
            style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: radii.sm,
              backgroundColor: on ? colors.plum : colors.white, borderWidth: 1,
              borderColor: on ? colors.plum : colors.rose }}>
            <TextInput selectionColor={colors.gold2} editable={false}
              style={[typography.small, { fontFamily: fonts.bodyMedium, color: on ? colors.pearl : colors.ink }]}>{o.label}</TextInput>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function SearchField({ value, onChange, placeholder = 'Search treatments…' }: {
  value: string; onChange: (t: string) => void; placeholder?: string;
}) {
  const { colors, radii, spacing, typography, fonts } = useTheme();
  const [local, setLocal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => setLocal(value), [value]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
      borderRadius: radii.md, borderWidth: 1, borderColor: colors.rose, paddingHorizontal: spacing.lg, gap: 8, marginHorizontal: spacing.lg }}>
      <AppText tone="soft">⌕</AppText>
      <TextInput value={local} placeholder={placeholder} placeholderTextColor={colors.mutedNight}
        onChangeText={t => { setLocal(t); if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => onChange(t), 250); }}
        autoCapitalize="none" style={[typography.body, { fontFamily: fonts.body, color: colors.ink, flex: 1, paddingVertical: 12 }]} />
      {local ? <Pressable onPress={() => { setLocal(''); onChange(''); }}><AppText tone="soft">✕</AppText></Pressable> : null}
    </View>
  );
}

export function OpenClosedChip({ rows, overrides, compact, stale }: {
  rows: HoursRow[]; overrides?: OverrideRow[]; compact?: boolean; stale?: boolean;
}) {
  const { colors, radii, spacing, fonts, typography } = useTheme();
  const st = computeOpenStatus(rows, overrides ?? []);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <StatusDot open={st.open} />
      <Text style={[typography.small, { fontFamily: fonts.bodySemiBold, color: colors.pearl }]}>
        {st.open ? '● Open now' : '● Closed now'}
      </Text>
      {!compact ? (
        <Text style={[typography.small, { fontFamily: fonts.body, color: colors.mutedNight }]}>
          {st.label === 'Open now' ? COPY.openEveryDay : st.detail}{stale ? ' · may have changed' : ''}
        </Text>
      ) : null}
    </View>
  );
}

/** R03 chain tracker: ① Consultation → ② Patch test → ③ Session. */
export function ChainStepper({ appts }: { appts: any[] }) {
  const { colors, radii, spacing, fonts, typography } = useTheme();
  const done = (type: string) => appts.some(a => a.type === type && a.status === 'COMPLETED');
  const booked = (type: string) => appts.some(a => a.type === type && a.status === 'SCHEDULED');
  const step = (type: string, label: string, idx: number, last = false) => {
    const state = done(type) ? 'done' : booked(type) ? 'next' : 'later';
    return (
      <View key={type} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ alignItems: 'center', width: 64 }}>
          <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
            backgroundColor: state === 'done' ? colors.success : state === 'next' ? colors.gold1 : colors.pearl,
            borderWidth: state === 'later' ? 1.5 : 0, borderColor: colors.rose }}>
            <Text style={{ fontSize: 12, color: state === 'later' ? colors.inkSoft : colors.white, fontWeight: '700' }}>
              {state === 'done' ? '✓' : String(idx + 1)}
            </Text>
          </View>
          <Text style={[typography.caption, { fontFamily: fonts.body, color: state === 'later' ? colors.inkSoft : colors.ink, marginTop: 4, textAlign: 'center' }]}>{label}</Text>
        </View>
        {!last ? <View style={{ flex: 1, height: 2, backgroundColor: state !== 'later' ? colors.goldLine : colors.rose, marginBottom: 18, borderRadius: 1 }} /> : null}
      </View>
    );
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm }}>
      {step('CONSULTATION', 'Consult', 0)}{step('PATCH_TEST', 'Patch test', 1)}{step('SESSION', 'Session', 2, true)}
    </View>
  );
}

export function AppointmentRow({ a, onPress }: { a: any; onPress?: () => void }) {
  const { colors, spacing } = useTheme();
  const warn = a.status === 'CANCEL_REQUESTED' || a.status === 'RESCHEDULE_REQUESTED';
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.lg, gap: spacing.md, backgroundColor: warn ? colors.rose : colors.white, borderBottomWidth: 1, borderBottomColor: colors.pearl }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.plum }}>
        <Text style={{ color: colors.gold2, fontSize: 14 }}>{a.type === 'CONSULTATION' ? '✦' : a.type === 'PATCH_TEST' ? '◉' : '◆'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <AppText role="bodyMedium">{appointmentTypeWord(a.type)}{a.treatment_name ? ` · ${a.treatment_name}` : ''}</AppText>
        <AppText role="small" tone="soft">{new Date(a.scheduled_start).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</AppText>
      </View>
      <Badge tone={a.status === 'SCHEDULED' ? 'success' : warn ? 'warn' : a.status === 'COMPLETED' ? 'neutral' : 'danger'} text={statusWord(a.status)} />
    </Pressable>
  );
}
function statusWord(s: string) {
  return ({ SCHEDULED: 'Confirmed', COMPLETED: 'Done', CANCELLED: 'Cancelled', CANCEL_REQUESTED: 'Cancel requested', RESCHEDULE_REQUESTED: 'Reschedule requested', NO_SHOW: 'Did not attend' } as Record<string, string>)[s] ?? s;
}

export function RequestCard({ r, unseen, onOpen, onCall }: { r: any; unseen?: boolean; onOpen: () => void; onCall: () => void }) {
  const { colors, spacing, radii } = useTheme();
  const prof = r.client_profiles ?? {};
  const name = `${prof.first_name ?? 'Client'} ${prof.last_name ?? ''}`.trim();
  const kind = r.request_kind === 'ADVISE_ME' ? 'ADVISE ME ✦' : r.request_kind === 'CONSULTATION' ? 'FREE CONSULTATION' : 'TREATMENT';
  return (
    <Pressable onPress={onOpen} style={{ backgroundColor: colors.white, borderRadius: radii.md, borderWidth: 1, borderColor: unseen ? colors.gold1 : colors.rose, padding: spacing.lg, gap: 6, marginBottom: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {unseen ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold1 }} /> : null}
        <AppText role="bodyMedium" style={{ flex: 1 }}>{name} · {prof.phone_e164 ? prof.phone_e164.replace(/^\+44/, '0') : 'no number'}</AppText>
        <Pressable onPress={onCall} hitSlop={10}><Badge text="☎" tone="gold" /></Pressable>
      </View>
      <AppText role="small" tone="accent">{kind}{r.treatment_name_snapshot ? ` — ${r.treatment_name_snapshot}` : ''}</AppText>
      <AppText role="small" tone="soft">prefers {new Date(r.preferred_date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · {bandWord(r.preferred_time_band)}
        {r.notes_client ? ` — “${r.notes_client.slice(0, 42)}${r.notes_client.length > 42 ? '…' : ''}”` : ''}</AppText>
    </Pressable>
  );
}
export function bandWord(b?: string | null) {
  return b === 'MORNING' ? 'Morning' : b === 'AFTERNOON' ? 'Afternoon' : b === 'EVENING' ? 'Evening' : 'Any time';
}

export function ThreadBubble({ msg }: { msg: { author_role: string; body: string; sent_at: string } }) {
  const { colors, radii, spacing, fonts, typography } = useTheme();
  const staff = msg.author_role === 'STAFF';
  return (
    <View style={{ alignSelf: staff ? 'flex-start' : 'flex-end', maxWidth: '82%',
      backgroundColor: staff ? colors.plumDeep : colors.white, borderRadius: radii.md,
      borderWidth: 1, borderColor: staff ? 'transparent' : colors.rose, padding: spacing.md, marginBottom: spacing.sm }}>
      <Text style={[typography.caption, { fontFamily: fonts.bodySemiBold, color: staff ? colors.gold2 : colors.goldText, marginBottom: 4 }]}>
        {staff ? 'The clinic' : 'You'} · {new Date(msg.sent_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
      </Text>
      <Text style={[typography.body, { fontFamily: fonts.body, color: colors.pearl, ...(staff ? {} : { color: colors.ink }) }]}>{msg.body}</Text>
    </View>
  );
}

export function Row({ label, sub, value, onPress, danger }: {
  label: string; sub?: string; value?: string; onPress?: () => void; danger?: boolean;
}) {
  const { colors, spacing, fonts, typography } = useTheme();
  const inner = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.lg, backgroundColor: colors.white, gap: spacing.md }}>
      <View style={{ flex: 1 }}>
        <Text style={[typography.bodyMedium, { fontFamily: fonts.bodyMedium, color: danger ? colors.danger : colors.ink }]}>{label}</Text>
        {sub ? <Text style={[typography.small, { fontFamily: fonts.body, color: colors.inkSoft, marginTop: 2 }]}>{sub}</Text> : null}
      </View>
      {value ? <Text style={[typography.small, { fontFamily: fonts.body, color: colors.inkSoft }]}>{value}</Text> : null}
      {onPress ? <Text style={{ color: colors.mutedNight, fontSize: 18 }}>›</Text> : null}
    </View>
  );
  return onPress
    ? <Pressable onPress={onPress}>{inner}<Divider /></Pressable>
    : <View>{inner}<Divider /></View>;
}

export function IdentityStrip({ role, name, unseen, onMore, onClientView }: {
  role: 'staff' | 'owner'; name: string; unseen?: number; onMore?: () => void; onClientView?: () => void;
}) {
  const { colors, spacing, fonts, typography } = useTheme();
  return (
    <View style={{ backgroundColor: colors.night2, paddingHorizontal: spacing.lg, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={[typography.caption, { fontFamily: fonts.bodySemiBold, color: colors.gold2, letterSpacing: 1 }]}>▣ {role.toUpperCase()}</Text>
      <Text style={[typography.small, { fontFamily: fonts.bodyMedium, color: colors.pearl, flex: 1 }]}>{name} · {COPY.clinicName}</Text>
      {unseen ? <View style={{ backgroundColor: colors.gold1, borderRadius: 9, minWidth: 18, height: 18, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.night, fontSize: 11, fontWeight: '700' }}>{unseen}</Text>
      </View> : null}
      {onClientView ? <Pressable onPress={onClientView} hitSlop={8}><Text style={[typography.caption, { fontFamily: fonts.bodySemiBold, color: colors.mutedNight }]}>Client view</Text></Pressable> : null}
      {onMore ? <Pressable onPress={onMore} hitSlop={8}><Text style={{ color: colors.pearl, fontSize: 18 }}>⋯</Text></Pressable> : null}
    </View>
  );
}

export function ClinicCallButton({ small }: { small?: boolean }) {
  return (
    <Button small={small} variant="quiet" title={`Call ${CLINIC.phoneDisplay}`}
      onPress={() => void Linking.openURL(`tel:${CLINIC.phoneTel}`)} />
  );
}
