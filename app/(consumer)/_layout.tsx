// app/(consumer)/_layout.tsx — the 4-slot role-adaptive shell (02-navigation-and-ia §1/§3).
// Same slot order for anon and client; labels swap with the session — no layout jump on sign-in.
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../theme/ThemeContext';

export default function ConsumerLayout() {
  const { ready, tier } = useAuth();
  const { colors } = useTheme();
  if (!ready) return null;
  const signedIn = tier !== 'anon';

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.plum,
      tabBarInactiveTintColor: colors.inkSoft,
      tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.rose, height: 84, paddingTop: 6 },
      tabBarLabelStyle: { fontSize: 11, fontFamily: 'InstrumentSans_500Medium' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home',
        tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} /> }} />
      <Tabs.Screen name="treatments" options={{ title: 'Treatments',
        tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'body' : 'body-outline'} size={22} color={color} /> }} />
      <Tabs.Screen name="intent" options={{ title: signedIn ? 'Request' : 'Consult',
        tabBarIcon: ({ color }) => <Ionicons name="sparkles" size={22} color={color} /> }} />
      <Tabs.Screen name="me" options={{ title: signedIn ? 'Profile' : 'Sign In',
        tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} /> }} />
      {/* pushed (non-tab) client routes — visible only when signed in */}
      <Tabs.Screen name="appointments" options={{ href: signedIn ? undefined : null }} />
      <Tabs.Screen name="requests" options={{ href: signedIn ? undefined : null }} />
      <Tabs.Screen name="enquiries" options={{ href: signedIn ? undefined : null }} />
      <Tabs.Screen name="updates" options={{ href: signedIn ? undefined : null }} />
      <Tabs.Screen name="consents" options={{ href: signedIn ? undefined : null }} />
      <Tabs.Screen name="deletion" options={{ href: signedIn ? undefined : null }} />
      <Tabs.Screen name="edit" options={{ href: signedIn ? undefined : null }} />
    </Tabs>
  );
}
