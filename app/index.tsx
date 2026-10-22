import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { env } from '../lib/env';
import { checkConnection, type ConnectionResult } from '../lib/supabase';
import { useTheme } from '../theme/ThemeContext';

const logo = require('../assets/unique-laser-clinics-logo-300x146.webp');

export default function Home() {
  const { colors, fonts, radii, spacing, typography } = useTheme();
  const [checking, setChecking] = useState(true);
  const [result, setResult] = useState<ConnectionResult | null>(null);

  const runCheck = useCallback(async () => {
    setChecking(true);
    setResult(await checkConnection());
    setChecking(false);
  }, []);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.pearl }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.xxl, paddingBottom: spacing.huge }}>
        <View style={styles.brandBlock}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={[typography.display, styles.title, { color: colors.ink, fontFamily: fonts.display }]}>
            Unique Laser Clinics
          </Text>
          <View style={[styles.rule, { backgroundColor: colors.goldLine }]} />
          <Text
            style={[
              typography.caption,
              styles.eyebrow,
              { color: colors.goldText, fontFamily: fonts.bodySemiBold },
            ]}
          >
            DEMO ENVIRONMENT · PHASE 1
          </Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.white, borderColor: colors.rose, borderRadius: radii.lg },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[typography.h2, { color: colors.ink, fontFamily: fonts.display }]}>
              Supabase connection
            </Text>
            {checking ? (
              <ActivityIndicator color={colors.plum} />
            ) : (
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: result?.ok ? colors.plum : colors.danger,
                    borderRadius: radii.pill,
                  },
                ]}
              >
                <Text style={[typography.caption, { color: colors.white, fontFamily: fonts.bodySemiBold }]}>
                  {result?.ok ? 'ONLINE' : 'OFFLINE'}
                </Text>
              </View>
            )}
          </View>

          <Text style={[typography.body, { color: colors.inkSoft, fontFamily: fonts.body }]}>
            {checking ? 'Contacting project…' : result?.message}
          </Text>

          <View style={[styles.meta, { borderTopColor: colors.pearl }]}>
            <MetaRow label="Project" value={env.projectHost} />
            <MetaRow
              label="Treatments"
              value={
                result?.treatmentCount === null || result?.treatmentCount === undefined
                  ? 'schema pending'
                  : String(result.treatmentCount)
              }
            />
            <MetaRow label="Auth" value="email + password (demo)" />
          </View>

          <Pressable
            onPress={runCheck}
            disabled={checking}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: pressed ? colors.plumDeep : colors.plum,
                borderRadius: radii.pill,
                opacity: checking ? 0.6 : 1,
              },
            ]}
          >
            <Text style={[typography.bodyMedium, { color: colors.white, fontFamily: fonts.bodySemiBold }]}>
              Run connection check
            </Text>
          </Pressable>
        </View>

        <Text
          style={[
            typography.small,
            styles.footer,
            { color: colors.inkSoft, fontFamily: fonts.body },
          ]}
        >
          Reveal your unique. Confidence. Care. Results.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  const { colors, fonts, spacing, typography } = useTheme();
  return (
    <View style={[styles.metaRow, { paddingVertical: spacing.sm }]}>
      <Text style={[typography.small, { color: colors.inkSoft, fontFamily: fonts.body }]}>{label}</Text>
      <Text
        numberOfLines={1}
        style={[
          typography.small,
          { color: colors.ink, fontFamily: fonts.bodySemiBold, flexShrink: 1, textAlign: 'right' },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  brandBlock: { alignItems: 'center', marginBottom: 28, marginTop: 12 },
  logo: { width: 210, height: 102, marginBottom: 14 },
  title: { textAlign: 'center' },
  rule: { width: 64, height: 2, marginVertical: 10, borderRadius: 2 },
  eyebrow: { letterSpacing: 1.6 },
  card: { borderWidth: 1, padding: 20 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusPill: { paddingHorizontal: 12, paddingVertical: 5 },
  meta: { borderTopWidth: 1, marginTop: 16, marginBottom: 18 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: { paddingVertical: 14, alignItems: 'center' },
  footer: { textAlign: 'center', marginTop: 26, fontStyle: 'italic' },
});
