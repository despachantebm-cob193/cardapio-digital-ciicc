import type { AuthProfile } from './authTypes';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

type SupabaseProfileRow = {
  id: string;
  auth_user_id: string;
  email: string | null;
  display_name: string | null;
  role: AuthProfile['role'];
  status: AuthProfile['status'];
};

function mapProfileRow(row: SupabaseProfileRow): AuthProfile {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    status: row.status,
  };
}

export async function getProfileByAuthUserId(authUserId: string): Promise<AuthProfile | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, auth_user_id, email, display_name, role, status')
    .eq('auth_user_id', authUserId)
    .maybeSingle<SupabaseProfileRow>();

  if (error) {
    throw error;
  }

  return data ? mapProfileRow(data) : null;
}

export function isActiveAdminProfile(profile: AuthProfile | null): boolean {
  return profile?.role === 'admin' && profile.status === 'active';
}
