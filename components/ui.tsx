// components/ui.tsx — primitives P1–P13 (docs/ui/05-component-library.md). Screens use these,
// never raw hex/typography (00-design-system-usage-rules §1).
import React from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, View, type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme/ThemeContext';

type Role = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodyMedium' | 'small' | 'caption';

export function AppText({ role = 'body', canvas = 'light', tone, style, children, ...rest }: {
  role?: Role; canvas?: 'light' | 'night' | 'gold'; tone?: 'primary' | 'soft' | 'accent' | 'success' | 'danger';
  style?: any; children?: React.ReactNode; numberOfLines?: number; onPress?: () => void;
}) {
  const { colors, typography, fonts } = useTheme();
  const t = typography[role];
  const ink = canvas === 'night'
    ? tone === 'soft' ? colors.mutedNight : colors.pearl
    : canvas === 'gold' ? colors.night
      : tone === 'soft' ? colors.inkSoft
        : tone === 'accent' ? colors.goldText
          : tone === 'success' ? colors.success
            : tone === 'danger' ? colors.danger : colors.ink;
  return (
    <Text {...rest} onPress={rest.onPress} style={[t, { color: ink, fontFamily: t.fontFamily },
      role === 'display' || role === 'h1' || role === 'h2' || role === 'h3' ? { letterSpacing: -0.5 } : null,
      role === 'display' || role === 'h1' ? { fontFamily: fonts.display } : null, style]}>
      {children}
    </Text>
  );
}

export function Eyebrow({ text, canvas = 'light', style }: { text: string; canvas?: 'light' | 'night'; style?: ViewStyle }) {
  const { colors, typography, fonts } = useTheme();
  return (
    <Text style={[typography.caption, {
      letterSpacing: 1.8, textTransform: 'uppercase', fontFamily: fonts.bodySemiBold,
      color: canvas === 'night' ? colors.gold2 : colors.goldText,
    }, style]}>{text}</Text>
  );
}

export function SectionHead({ title, onRight, right }: { title: string; onRight?: () => void; right?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 16 }}>
      <AppText role="h3">{title}</AppText>
      {onRight && right ? <Pressable onPress={onRight}><AppText tone="accent" role="small">{right} ›</AppText></Pressable> : null}
    </View>
  );
}

type BtnProps = {
  title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'quiet' | 'dangerText';
  disabled?: boolean; loading?: boolean; full?: boolean; small?: boolean; style?: ViewStyle;
};
export function Button({ title, onPress, variant = 'primary', disabled, loading, full, small, style }: BtnProps) {
  const { colors, radii, spacing, typography, fonts, gradients } = useTheme();
  const label = (color: string) => (
    <Text style={[small ? typography.small : typography.bodyMedium,
      { color, fontFamily: fonts.bodySemiBold, letterSpacing: 0.2 }]}>
      {loading ? '…' : title}
    </Text>
  );
  const common = { opacity: disabled ? 0.45 : 1 };
  if (variant === 'primary') {
    return (
      <Pressable disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [
        style, full && styles.full, { opacity: disabled ? 0.45 : pressed ? 0.9 : 1 },
      ]}>
        <LinearGradient colors={[gradients.gold[0], gradients.gold[1]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.6 }}
          style={[styles.btn, { borderRadius: radii.pill }, common]}>
          {loading ? <ActivityIndicator color={colors.night} /> : label(colors.night)}
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [
      style, full && styles.full, { opacity: pressed ? 0.85 : disabled ? 0.45 : 1 },
    ]}>
      <View style={[styles.btn, {
        borderRadius: variant === 'secondary' ? radii.pill : radii.md,
        backgroundColor: variant === 'secondary' ? colors.plum : 'transparent',
        borderWidth: variant === 'ghost' ? 1 : 0, borderColor: variant === 'ghost' ? colors.ink : 'transparent',
        paddingHorizontal: variant === 'quiet' ? spacing.xs : spacing.xxl,
        minHeight: variant === 'quiet' ? 40 : 52, justifyContent: 'center', alignItems: 'center',
      }, common]}>
        {label(variant === 'secondary' ? colors.white : variant === 'dangerText' ? colors.danger
          : variant === 'quiet' ? colors.inkSoft : colors.ink)}
      </View>
    </Pressable>
  );
}

export function Field({ label, value, onChange, error, helper, secure, keyboardType, autoCapitalize = 'none', multiline, placeholder, autoFocus }: {
  label?: string; value: string; onChange: (t: string) => void; error?: string | null; helper?: string;
  secure?: boolean; keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'words'; multiline?: boolean; placeholder?: string; autoFocus?: boolean;
}) {
  const { colors, radii, spacing, typography, fonts } = useTheme();
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <AppText role="small" tone="soft">{label}</AppText> : null}
      <TextInput
        autoFocus={autoFocus} secureTextEntry={secure} keyboardType={keyboardType} autoCapitalize={autoCapitalize}
        placeholder={placeholder} placeholderTextColor={colors.mutedNight} value={value} multiline={multiline}
        onChangeText={onChange}
        style={[typography.body, {
          fontFamily: fonts.body, color: colors.ink, backgroundColor: colors.white,
          borderWidth: 1, borderColor: error ? colors.danger : colors.rose,
          borderRadius: radii.md, paddingHorizontal: spacing.lg, paddingVertical: multiline ? spacing.md : 12,
          minHeight: multiline ? 96 : 48, textAlignVertical: multiline ? 'top' : 'center',
        }]}
      />
      {error ? <AppText role="small" tone="danger">⚠ {error}</AppText>
        : helper ? <AppText role="small" tone="soft">{helper}</AppText> : null}
    </View>
  );
}

export function Card({ children, onPress, canvas = 'white', style }: {
  children: React.ReactNode; onPress?: () => void; canvas?: 'white' | 'night' | 'rose'; style?: ViewStyle;
}) {
  const { colors, radii, borders, spacing } = useTheme();
  const bg = canvas === 'night' ? colors.night : canvas === 'rose' ? colors.rose : colors.white;
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [
      { backgroundColor: bg, borderRadius: radii.md, borderWidth: 1, borderColor: canvas === 'night' ? borders.lineNight : borders.line, overflow: 'hidden' },
      onPress && { opacity: pressed ? 0.92 : 1 }, style]}>
      <View style={{ padding: spacing.lg }}>{children}</View>
    </Pressable>
  );
}

export function Badge({ text, tone = 'neutral' }: { text: string; tone?: 'neutral' | 'success' | 'warn' | 'danger' | 'gold' }) {
  const { colors, radii, typography, fonts } = useTheme();
  const map: any = {
    neutral: { bg: colors.pearl, fg: colors.inkSoft },
    success: { bg: colors.white, fg: colors.success, border: colors.rose },
    warn: { bg: colors.rose, fg: colors.ink },
    danger: { bg: colors.white, fg: colors.danger, border: colors.danger },
    gold: { bg: colors.plumDeep, fg: colors.gold2 },
  };
  const m = map[tone];
  return (
    <View style={{ backgroundColor: m.bg, borderWidth: m.border ? 1 : 0, borderColor: m.border ?? 'transparent', borderRadius: radii.sm, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text style={[typography.caption, { color: m.fg, fontFamily: fonts.bodySemiBold }]}>{text}</Text>
    </View>
  );
}

export function CountBadge({ n }: { n: number }) {
  const { colors, radii } = useTheme();
  if (!n) return null;
  return (
    <View style={{ backgroundColor: colors.gold1, borderRadius: radii.pill, minWidth: 18, height: 18, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.night, fontSize: 11, fontWeight: '700' }}>{n > 9 ? '9+' : n}</Text>
    </View>
  );
}

export function StatusDot({ open }: { open: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: open ? colors.statusOpen : colors.mutedNight,
      boxShadow: open ? '0 0 0 4px rgba(127,214,154,.18)' : 'none' }} />
  );
}

export function Divider({ night }: { night?: boolean }) {
  const { colors, borders } = useTheme();
  return <View style={{ height: 1, backgroundColor: night ? borders.lineNight : borders.line, marginVertical: 12 }} />;
}

export function GoldRule() {
  const { colors } = useTheme();
  return <View style={{ width: 56, height: 2, backgroundColor: colors.goldLine, borderRadius: 1 }} />;
}

export function LinkText({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors, fonts, typography } = useTheme();
  return (
    <Text onPress={onPress} style={[typography.small, { fontFamily: fonts.bodySemiBold, color: colors.goldText }]}>
      {label}
    </Text>
  );
}

export function ToggleRow({ label, value, onChange, sub }: { label: string; value: boolean; onChange: (v: boolean) => void; sub?: string }) {
  const { colors, fonts, typography } = useTheme();
  return (
    <Pressable onPress={() => onChange(!value)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}>
      <View style={{ minWidth: 44, height: 26, borderRadius: 13, paddingHorizontal: 2, justifyContent: 'center', backgroundColor: value ? colors.success : colors.rose }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white, alignSelf: value ? 'flex-end' : 'flex-start' }} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { fontFamily: fonts.body, color: colors.ink }]}>{label}</Text>
        {sub ? <Text style={[typography.caption, { fontFamily: fonts.body, color: colors.inkSoft }]}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

export function EmptyState({ icon, title, lines, actionLabel, onAction, quietLabel, onQuiet }: {
  icon?: string; title: string; lines?: string[]; actionLabel?: string; onAction?: () => void; quietLabel?: string; onQuiet?: () => void;
}) {
  const { colors, spacing, typography, fonts } = useTheme();
  return (
    <View style={{ padding: spacing.xxl, alignItems: 'center' }}>
      {icon ? <Text style={{ fontSize: 30, marginBottom: 8 }}>{icon}</Text> : null}
      <AppText role="h3" style={{ textAlign: 'center' }}>{title}</AppText>
      {lines?.map(l => (
        <Text key={l} style={[typography.small, { fontFamily: fonts.body, color: colors.inkSoft, textAlign: 'center', marginTop: 6, lineHeight: 20 }]}>{l}</Text>
      ))}
      {actionLabel && onAction ? <View style={{ marginTop: spacing.lg }}><Button title={actionLabel} onPress={onAction} /></View> : null}
      {quietLabel && onQuiet ? <View style={{ marginTop: spacing.sm }}><Button title={quietLabel} variant="quiet" onPress={onQuiet} /></View> : null}
    </View>
  );
}

export function ErrorRetry({ message = 'Couldn’t reach the clinic’s records.', onRetry, extraLabel, onExtra }: {
  message?: string; onRetry: () => void; extraLabel?: string; onExtra?: () => void;
}) {
  const { colors, spacing, typography, fonts } = useTheme();
  return (
    <View style={{ margin: spacing.lg, padding: spacing.lg, backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.danger }}>
      <AppText role="bodyMedium" tone="danger">⚠ {message}</AppText>
      <Text style={[typography.small, { fontFamily: fonts.body, color: colors.inkSoft, marginTop: 4 }]}>
        An appointment you can’t confirm is worse than none — please try again.
      </Text>
      <View style={{ marginTop: spacing.md }}><Button title="Try again" variant="ghost" onPress={onRetry} full /></View>
      {extraLabel && onExtra ? <View style={{ marginTop: spacing.xs }}><Button title={extraLabel} variant="quiet" onPress={onExtra} /></View> : null}
    </View>
  );
}

export function OfflineBanner({ cached = true }: { cached?: boolean }) {
  const { colors, spacing, typography, fonts } = useTheme();
  return (
    <View style={{ backgroundColor: cached ? colors.rose : colors.danger, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={{ color: cached ? colors.ink : colors.white, fontSize: 13 }}>⚠</Text>
      <Text style={[typography.small, { fontFamily: fonts.body, color: cached ? colors.ink : colors.white, flex: 1 }]}>
        {cached ? 'You’re offline — showing the saved treatment list. Prices and hours may have changed.'
          : 'You’re offline — live data can’t be shown.'}
      </Text>
    </View>
  );
}

export function SoftWarnBanner({ text }: { text: string }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ backgroundColor: colors.rose, borderRadius: 10, borderWidth: 1, borderColor: colors.goldLine, padding: spacing.md, flexDirection: 'row', gap: 8 }}>
      <Text style={{ color: colors.ink }}>⚠</Text>
      <Text style={{ color: colors.ink, fontSize: 13, lineHeight: 19, flex: 1 }}>{text}</Text>
    </View>
  );
}

export function Skeleton({ w = '100%', h = 16, r = 8, style }: { w?: any; h?: number; r?: number; style?: ViewStyle }) {
  const { colors } = useTheme();
  return <View style={{ width: w, height: h, borderRadius: r, backgroundColor: colors.rose, opacity: 0.7, ...style }} />;
}
export const ListSkeleton = ({ n = 3 }: { n?: number }) => (
  <View style={{ gap: 12, padding: 16 }}>
    {Array.from({ length: n }).map((_, i) => <Skeleton key={i} h={72} r={14} />)}
  </View>
);
export const CardSkeleton = ({ h = 150 }: { h?: number }) => <Skeleton h={h} r={14} />;

export function Screen({ children, canvas = 'pearl', scroll = true, bounces, refresh, refreshing, keyboard = false, header, footer, contentStyle }: {
  children: React.ReactNode; canvas?: 'pearl' | 'white' | 'night' | 'rose'; scroll?: boolean; bounces?: boolean;
  refresh?: () => void; refreshing?: boolean; keyboard?: boolean; header?: React.ReactNode; footer?: React.ReactNode;
  contentStyle?: ViewStyle;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bg = canvas === 'night' ? colors.night : canvas === 'rose' ? colors.rose : canvas === 'white' ? colors.white : colors.pearl;
  let body: React.ReactNode = scroll
    ? (
      <ScrollView contentContainerStyle={[{ paddingBottom: insets.bottom + 96 }, contentStyle]}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
        bounces={bounces} refreshControl={refresh ? <RefreshControl refreshing={!!refreshing} onRefresh={refresh} tintColor={colors.plum} /> : undefined}>
        {children}
      </ScrollView>
    )
    : <View style={{ flex: 1 }}>{children}</View>;
  if (keyboard) body = <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>{body}</KeyboardAvoidingView>;
  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>
      {header}
      <View style={{ flex: 1 }}>{body}</View>
      {footer ? <View style={{ backgroundColor: bg, paddingHorizontal: 16, paddingTop: 10, paddingBottom: insets.bottom + 8, borderTopWidth: 1, borderTopColor: colors.rose }}>{footer}</View> : null}
    </View>
  );
}

export function ScreenHeader({ title, onBack, right, canvas = 'light', eyebrow }: {
  title: string; onBack?: () => void; right?: React.ReactNode; canvas?: 'light' | 'night'; eyebrow?: string;
}) {
  const { colors, spacing, typography, fonts, borders } = useTheme();
  const ink = canvas === 'night' ? colors.pearl : colors.ink;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: spacing.lg, gap: 8 }}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: canvas === 'night' ? colors.night2 : colors.white, borderWidth: 1, borderColor: canvas === 'night' ? borders.lineNight : borders.line }}>
          <Text style={{ color: ink, fontSize: 18 }}>‹</Text>
        </Pressable>
      ) : <View style={{ width: 8 }} />}
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text style={[typography.caption, { fontFamily: fonts.bodySemiBold, letterSpacing: 1.4, color: canvas === 'night' ? colors.gold2 : colors.goldText, textTransform: 'uppercase' }]}>{eyebrow}</Text> : null}
        <Text numberOfLines={1} style={[typography.h2, { fontFamily: fonts.display, color: ink }]}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  full: { alignSelf: 'stretch' },
  btn: { minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
});
