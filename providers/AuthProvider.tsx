// providers/AuthProvider.tsx — session → tier, the one navigation brain (02-navigation-and-ia §4).
import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';

import * as auth from '../lib/auth';
import * as db from '../lib/db';

export type Tier = 'anon' | 'client' | 'admin';

type AuthValue = {
  ready: boolean;
  user: User | null;
  tier: Tier;
  role: 'client' | 'staff' | 'owner';
  profile: any | null;
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'client' | 'staff' | 'owner'>('client');
  const [profile, setProfile] = useState<any | null>(null);

  const load = async (u: User | null) => {
    setUser(u);
    if (!u) { setRole('client'); setProfile(null); return; }
    const [r, p] = await Promise.all([db.getMyRole(), db.getMyProfile()]);
    setRole(r.data === 'owner' || r.data === 'staff' ? r.data : 'client');
    setProfile(p.data ?? null);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await auth.currentSession();
      if (!alive) return;
      await load(s?.user ?? null);
      setReady(true);
    })();
    const off = auth.onAuthChange(u => { void load(u); });
    return () => { alive = false; off(); };
  }, []);

  const value = useMemo<AuthValue>(() => ({
    ready,
    user,
    tier: !user ? 'anon' : role === 'client' ? 'client' : 'admin',
    role,
    profile,
    refresh: () => load(user),
    signIn: async (email, password) => {
      const { error } = await auth.signInWithPassword(email, password);
      return { error: error ? error.message : null };
    },
    signOut: async () => { await auth.signOut(); },
  }), [ready, user, role, profile]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
}
