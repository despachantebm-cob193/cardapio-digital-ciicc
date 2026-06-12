
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function getMissingSupabaseEnvVars() {
  const missingVars: string[] = [];

  if (!supabaseUrl) {
    missingVars.push('VITE_SUPABASE_URL');
  }

  if (!supabaseAnonKey) {
    missingVars.push('VITE_SUPABASE_ANON_KEY');
  }

  return missingVars;
}

export function isSupabaseConfigured() {
  return getMissingSupabaseEnvVars().length === 0;
}

export function assertSupabaseEnv() {
  const missingVars = getMissingSupabaseEnvVars();

  if (missingVars.length > 0) {
    throw new Error(
      `Variáveis de ambiente Supabase ausentes: ${missingVars.join(', ')}. Configure .env.local para ambiente local.`,
    );
  }
}

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export type SupabaseClientInstance = NonNullable<typeof supabase>;
