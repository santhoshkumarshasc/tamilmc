import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase credentials provided by user
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_a9tTT1WVyox8Vlpih6OpJw_7tAiAdFN';

export const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  'sb_secret_zjyau_f42AZR2UGTNpP3ag_KtXX9h0N';

export const SUPABASE_URL = process.env.SUPABASE_URL || '';

let supabaseClientInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

/**
 * Returns standard Supabase client (using publishable / anon key).
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL) return null;
  if (!supabaseClientInstance) {
    try {
      supabaseClientInstance = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: false }
      });
    } catch (err) {
      console.warn('[Supabase] Client init failed:', err);
      return null;
    }
  }
  return supabaseClientInstance;
}

/**
 * Returns elevated Supabase admin client (using secret / service_role key) for backend operations.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!SUPABASE_URL) return null;
  if (!supabaseAdminInstance) {
    try {
      supabaseAdminInstance = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
    } catch (err) {
      console.warn('[Supabase Admin] Init failed:', err);
      return null;
    }
  }
  return supabaseAdminInstance;
}

/**
 * Checks connection status to Supabase.
 */
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  configured: boolean;
  url: string;
  hasPublishableKey: boolean;
  hasSecretKey: boolean;
  error?: string;
}> {
  const configured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
  if (!configured) {
    return {
      connected: false,
      configured: false,
      url: SUPABASE_URL,
      hasPublishableKey: Boolean(SUPABASE_PUBLISHABLE_KEY),
      hasSecretKey: Boolean(SUPABASE_SECRET_KEY),
      error: 'SUPABASE_URL is not set. Please provide your Supabase Project URL (e.g. https://your-project.supabase.co).'
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      configured: true,
      url: SUPABASE_URL,
      hasPublishableKey: Boolean(SUPABASE_PUBLISHABLE_KEY),
      hasSecretKey: Boolean(SUPABASE_SECRET_KEY),
      error: 'Failed to create Supabase client'
    };
  }

  try {
    const { error } = await client.from('profiles').select('id').limit(1);
    return {
      connected: !error,
      configured: true,
      url: SUPABASE_URL,
      hasPublishableKey: true,
      hasSecretKey: Boolean(SUPABASE_SECRET_KEY),
      error: error ? error.message : undefined
    };
  } catch (err: any) {
    return {
      connected: false,
      configured: true,
      url: SUPABASE_URL,
      hasPublishableKey: true,
      hasSecretKey: Boolean(SUPABASE_SECRET_KEY),
      error: err?.message || String(err)
    };
  }
}
