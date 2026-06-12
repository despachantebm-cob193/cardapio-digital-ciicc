
import type { Session, User } from '@supabase/supabase-js';
import {
  assertSupabaseEnv,
  isSupabaseConfigured,
  supabase,
} from '../../lib/supabaseClient';

export type AuthSession = Session;
export type AuthUser = User;

export function isSupabaseAuthConfigured() {
  return isSupabaseConfigured();
}

function getSupabaseAuth() {
  assertSupabaseEnv();

  if (!supabase) {
    throw new Error('Cliente Supabase indisponível. Verifique a configuração do ambiente.');
  }

  return supabase.auth;
}

export async function getCurrentSession() {
  if (!isSupabaseAuthConfigured() || !supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export async function signInWithGoogle() {
  const auth = getSupabaseAuth();

  const { data, error } = await auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOutFromSupabase() {
  const auth = getSupabaseAuth();
  const { error } = await auth.signOut();

  if (error) {
    throw error;
  }
}

export function onSupabaseAuthStateChange(
  callback: (session: AuthSession | null) => void,
) {
  if (!isSupabaseAuthConfigured() || !supabase) {
    return () => undefined;
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => subscription.unsubscribe();
}
