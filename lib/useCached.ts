// lib/useCached.ts — public-catalogue caching for offline browse (04-screen-craft §6):
// render last-good instantly, refresh silently; on network failure show the cached banner.
// Personal data NEVER uses this (offline = explicit error, no stale).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useCached<T>(key: string, fetcher: () => Promise<{ data: T | null; error: string | null }>, opts: { initial?: T } = {}) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const run = useCallback(async (force?: boolean) => {
    if (!force) {
      try {
        const raw = await AsyncStorage.getItem('cache:' + key);
        if (raw && alive.current) setData(JSON.parse(raw) as T);
      } catch { /* corrupted cache — ignore */ }
    }
    const res = await fetcher();
    if (!alive.current) return;
    if (res.data != null) {
      setData(res.data); setError(null); setOffline(false);
      try { await AsyncStorage.setItem('cache:' + key, JSON.stringify(res.data)); } catch { /* quota */ }
    } else {
      setError(res.error ?? 'Unknown error');
      if (/network|fetch/i.test(res.error ?? '')) setOffline(true);
    }
    setLoading(false);
  }, [key]);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void run(); }, [run]);
  return { data, error, offline, loading, refresh: () => void run(true) };
}
