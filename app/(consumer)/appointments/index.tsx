// app/(consumer)/appointments/index.tsx — My appointments (05-appointments/00): upcoming + past.
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import * as db from '../../../lib/db';
import { useTheme } from '../../../theme/ThemeContext';
import { EmptyState, ErrorRetry, Eyebrow, Screen, ScreenHeader } from '../../../components/ui';
import { AppointmentRow } from '../../../components/Domain';

export default function Appointments() {
  const router = useRouter();
  const { spacing } = useTheme();
  const [rows, setRows] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [treatments, setTreatments] = useState<Record<string, string>>({});
  const [up, setUp] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  const load = async () => {
    setRefreshing(true);
    const [a, t] = await Promise.all([db.myAppointments(), db.getTreatments()]);
    if (a.error) setErr(a.error);
    else {
      setRows(a.data ?? []); setErr(null);
      const tm: Record<string, string> = {}; (t.data ?? []).forEach((x: any) => { tm[x.id] = x.name; });
      setTreatments(tm);
      const now = Date.now();
      setUp((a.data ?? []).filter(x => new Date(x.scheduled_start).getTime() >= now - 3600e3 && x.status === 'SCHEDULED').sort((p, q) => p.scheduled_start.localeCompare(q.scheduled_start)));
      setPast((a.data ?? []).filter(x => !(new Date(x.scheduled_start).getTime() >= now - 3600e3 && x.status === 'SCHEDULED')).sort((p, q) => q.scheduled_start.localeCompare(p.scheduled_start)));
    }
    setRefreshing(false);
  };
  useEffect(() => { void load(); }, []);

  return (
    <Screen canvas="pearl" refresh={load} refreshing={refreshing} scroll>
      <ScreenHeader title="My appointments" onBack={() => router.back()} />
      {err ? <ErrorRetry onRetry={load} /> : null}
      {!err && up.length === 0 && past.length === 0 && rows ? (
        <EmptyState icon="📅" title="Nothing booked yet"
          lines={['Request a free consultation and the clinic confirms within one working day.']}
          actionLabel="✦ Request an appointment" onAction={() => router.replace('/intent')} />
      ) : null}
      {up.length ? (
        <View style={{ marginBottom: spacing.lg }}>
          <Eyebrow text="UPCOMING" style={{ paddingHorizontal: spacing.lg, marginVertical: 8 }} />
          {up.map(a => <AppointmentRow key={a.id} a={{ ...a, treatment_name: treatments[a.treatment_id] }} onPress={() => router.push(`/appointments/${a.id}`)} />)}
        </View>
      ) : null}
      {past.length ? (
        <View>
          <Eyebrow text="PAST" style={{ paddingHorizontal: spacing.lg, marginVertical: 8 }} />
          {past.map(a => <AppointmentRow key={a.id} a={{ ...a, treatment_name: treatments[a.treatment_id] }} onPress={() => router.push(`/appointments/${a.id}`)} />)}
        </View>
      ) : null}
    </Screen>
  );
}
