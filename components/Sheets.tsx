// components/Sheets.tsx — BottomSheet + AuthGateSheet (cross-cutting §3) + ConfirmSheet.
import React from 'react';
import { Linking, Modal, Pressable, ScrollView, View } from 'react-native';

import { useTheme } from '../theme/ThemeContext';
import { AppText, Button, Divider } from './ui';
import { CLINIC, COPY } from '../lib/content';

export function BottomSheet({ visible, onClose, children, half }: {
  visible: boolean; onClose: () => void; children: React.ReactNode; half?: boolean;
}) {
  const { colors, radii } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(26,18,32,0.5)' }} onPress={onClose}>
        <View style={{ flex: 1 }} />
      </Pressable>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: half ? '55%' : '78%',
        backgroundColor: colors.pearl, borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg,
        borderTopWidth: 1, borderColor: colors.goldLine }}>
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.rose }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

/** The one modal that speaks for all gated actions (S02: never a dead end). */
export function AuthGateSheet({ visible, onClose, onSignIn, onSignUp }: {
  visible: boolean; onClose: () => void; onSignIn: () => void; onSignUp: () => void;
}) {
  const { colors } = useTheme();
  return (
    <BottomSheet visible={visible} onClose={onClose} half>
      <AppText role="h2">Start with your details</AppText>
      <View style={{ gap: 6, marginTop: 10 }}>
        <AppText role="body">• Request bookings and track them</AppText>
        <AppText role="body">• See reminders before your visits</AppText>
        <AppText role="body">• Ask the clinic questions privately</AppText>
      </View>
      <Divider />
      <Button title="Create account" onPress={onSignUp} full />
      <View style={{ height: 8 }} />
      <Button title="Sign in" variant="secondary" onPress={onSignIn} full />
      <View style={{ height: 4 }} />
      <Button title="Just looking — dismiss" variant="quiet" onPress={onClose} full />
      <AppText role="small" tone="soft" style={{ marginTop: 12 }}>{COPY.privacyPromise}</AppText>
      <Pressable onPress={() => void Linking.openURL(`tel:${CLINIC.phoneTel}`)} style={{ marginTop: 6 }}>
        <AppText role="small" tone="accent">Prefer to call? {CLINIC.phoneDisplay}</AppText>
      </Pressable>
      <View style={{ height: 8 }} />
      <View style={{ display: 'none', backgroundColor: colors.night }} />
    </BottomSheet>
  );
}

export function ConfirmSheet({ visible, onClose, onConfirm, title, lines, confirmLabel = 'Confirm', danger }: {
  visible: boolean; onClose: () => void; onConfirm: () => void; title: string; lines: string[];
  confirmLabel?: string; danger?: boolean;
}) {
  const [busy, setBusy] = React.useState(false);
  return (
    <BottomSheet visible={visible} onClose={onClose} half>
      <AppText role="h3">{title}</AppText>
      <View style={{ gap: 6, marginVertical: 10 }}>
        {lines.map(l => <AppText key={l} role="body" tone="soft">{l}</AppText>)}
      </View>
      <Button title={busy ? '…' : confirmLabel} variant={danger ? 'dangerText' : 'primary'} full
        disabled={busy} onPress={() => { setBusy(true); onConfirm(); setTimeout(() => setBusy(false), 1200); }} />
      <View style={{ height: 6 }} />
      <Button title="Keep as is" variant="quiet" onPress={onClose} full />
    </BottomSheet>
  );
}
