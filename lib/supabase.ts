import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { env } from './env';

// S02 acceptance (docs/schema-coaching/01-user-stories.md) — session tokens live in the
// Keychain/Keystore via expo-secure-store, not plain AsyncStorage (contradiction 1.6 in
// docs/schema/04, closed by this adapter). Web preview falls back to AsyncStorage; supabase-js
// uses an in-memory store under Node/CI.
const authStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') return AsyncStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type ConnectionResult = {
  ok: boolean;
  message: string;
  treatmentCount: number | null;
};

export async function checkConnection(): Promise<ConnectionResult> {
  try {
    const { count, error } = await supabase
      .from('treatments')
      .select('id', { count: 'exact', head: true });

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return {
          ok: true,
          message: 'Connected — demo schema not applied yet',
          treatmentCount: null,
        };
      }
      return { ok: false, message: error.message, treatmentCount: null };
    }

    return { ok: true, message: 'Connected', treatmentCount: count ?? null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown network error';
    return { ok: false, message, treatmentCount: null };
  }
}
