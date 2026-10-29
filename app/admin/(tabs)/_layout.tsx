// app/admin/(tabs)/_layout.tsx — 4-tab admin shell (📥 Queue · ☎ Dial · 💆 Care · ⋯ More).
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '../../../theme/ThemeContext';

export default function AdminTabs() {
  const { colors } = useTheme();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.gold2,
      tabBarInactiveTintColor: colors.mutedNight,
      tabBarStyle: { backgroundColor: colors.night, borderTopColor: colors.night2, height: 84, paddingTop: 6 },
      tabBarLabelStyle: { fontSize: 11, fontFamily: 'InstrumentSans_500Medium' },
    }}>
      <Tabs.Screen name="queue" options={{ title: 'Queue', tabBarIcon: ({ color }) => <Ionicons name="file-tray-full" size={21} color={color} /> }} />
      <Tabs.Screen name="dial" options={{ title: 'Dial', tabBarIcon: ({ color }) => <Ionicons name="call" size={21} color={color} /> }} />
      <Tabs.Screen name="care" options={{ title: 'Care', tabBarIcon: ({ color }) => <Ionicons name="heart" size={21} color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ color }) => <Ionicons name="ellipsis-horizontal" size={21} color={color} /> }} />
    </Tabs>
  );
}
