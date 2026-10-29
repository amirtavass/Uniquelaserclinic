import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

// Auth seam (S01/S02). Email/password is real now; phone OTP is wired at M1 (D-F1 demo default).
// Screens must not call supabase.auth directly — this is the only auth entry point.

export async function signUpWithPassword(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}): Promise<{ user: User | null; error: string | null }> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { first_name: input.firstName, last_name: input.lastName } },
  });
  if (error) return { user: null, error: translateAuthError(error.message) };
  return { user: data.user ?? null, error: null };
}

export async function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function currentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(callback: (user: User | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => data.subscription.unsubscribe();
}

export async function resendVerification() {
  const { data } = await supabase.auth.getSession();
  const email = data.session?.user.email;
  if (!email) return { error: 'No signed-in account' };
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  return { error: error ? translateAuthError(error.message) : null };
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  return { error: error ? translateAuthError(error.message) : null };
}

// DA-19: phone OTP is simulated locally for the demo (schema unchanged) — real OTP wires here at M1.5.
export async function requestPhoneOtp(_phoneE164: string): Promise<{ demoCode: string }> {
  return { demoCode: '246810' };
}
export async function confirmPhoneOtp(_code: string): Promise<{ error: string | null }> {
  return { error: null };
}

// Duplicate email/phone must surface as the friendly recovery copy from S01, not raw Postgres text.
function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('already registered') || m.includes('already exists')) {
    return 'That email or number is already with us — try signing in, or tap “Forgot details” and we will call you.';
  }
  return message;
}
