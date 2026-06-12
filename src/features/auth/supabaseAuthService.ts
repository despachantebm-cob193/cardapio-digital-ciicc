import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabaseClient';

export type AuthSession = Session;
export type AuthUser = User;

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
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
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export function onSupabaseAuthStateChange(
  callback: (session: AuthSession | null) => void,
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => subscription.unsubscribe();
}
