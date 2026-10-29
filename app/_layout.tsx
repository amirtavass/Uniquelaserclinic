import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  Cormorant_400Regular,
  Cormorant_500Medium,
  Cormorant_600SemiBold,
  Cormorant_700Bold,
  useFonts as useCormorant,
} from '@expo-google-fonts/cormorant';
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
  useFonts as useInstrumentSans,
} from '@expo-google-fonts/instrument-sans';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '../theme/ThemeContext';
import { AuthProvider } from '../providers/AuthProvider';
import { colors } from '../theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [cormorantLoaded] = useCormorant({
    Cormorant_400Regular,
    Cormorant_500Medium,
    Cormorant_600SemiBold,
    Cormorant_700Bold,
  });
  const [instrumentLoaded] = useInstrumentSans({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
  });

  const loaded = cormorantLoaded && instrumentLoaded;

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.pearl },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
