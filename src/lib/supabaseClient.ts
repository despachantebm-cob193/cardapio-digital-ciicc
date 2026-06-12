import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function assertSupabaseEnv() {
  const missingVars: string[] = [];

  if (!supabaseUrl) {
    missingVars.push('VITE_SUPABASE_URL');
  }

  if (!supabaseAnonKey) {
    missingVars.push('VITE_SUPABASE_ANON_KEY');
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Variáveis de ambiente Supabase ausentes: ${missingVars.join(', ')}. Configure .env.local para ambiente local.`,
    );
  }
}

assertSupabaseEnv();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type SupabaseClientInstance = typeof supabase;
