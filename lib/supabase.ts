import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { env } from './env';

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
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
