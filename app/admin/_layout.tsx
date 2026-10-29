// app/admin/_layout.tsx — the role-guarded admin workspace (02-navigation §4) + identity strip.
import { Stack, router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { IdentityStrip } from '../../components/Domain';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../theme/ThemeContext';
import { AppText, Button, Screen } from '../../components/ui';

export default function AdminLayout() {
  const { ready, tier, role, profile, user } = useAuth();
  const { colors, spacing } = useTheme();
  if (!ready) return null;
  if (tier === 'anon' || role === 'client') {
    return (
      <Screen canvas="pearl">
        <View style={{ padding: spacing.xxl, gap: 12, alignItems: 'center' }}>
          <AppText role="h2">Staff only</AppText>
          <AppText role="body" tone="soft" style={{ textAlign: 'center' }}>
            This area needs a staff seat granted by the owner. Head back to browse — nothing is lost.
          </AppText>
          <Button variant="secondary" title="Back to the clinic" onPress={() => router.replace('/')} />
        </View>
      </Screen>
    );
  }
  const name = profile?.first_name ?? (user?.email ? user.email.slice(0, user.email.indexOf('@')) : 'Staff');
  return (
    <View style={{ flex: 1, backgroundColor: colors.pearl }}>
      <IdentityStrip role={role as 'staff' | 'owner'} name={String(name)}
        onClientView={() => router.replace('/')}
        onMore={() => router.push('/admin/more')} />
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </View>
  );
}
