import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { normalizeSupabaseUrl } from './supabaseUtils';

export { normalizeSupabaseUrl };

let cachedUrl = '';
let cachedKey = '';
let serverClient: SupabaseClient | null = null;
let hasLoggedMissingServerEnv = false;

export function getSupabaseServerClient(): SupabaseClient | null {
  const rawUrl = (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  ).trim();

  const supabaseUrl = normalizeSupabaseUrl(rawUrl);

  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  // Validate URL and Key
  if (!supabaseUrl || !supabaseKey || supabaseKey.toLowerCase().includes('placeholder')) {
    if (!hasLoggedMissingServerEnv) {
      console.warn(
        '[SupabaseServer] Supabase production database credentials are not configured or invalid. ' +
        'Expected NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).'
      );
      hasLoggedMissingServerEnv = true;
    }
    return null;
  }

  if (!serverClient || cachedUrl !== supabaseUrl || cachedKey !== supabaseKey) {
    try {
      serverClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      cachedUrl = supabaseUrl;
      cachedKey = supabaseKey;
    } catch (err: any) {
      console.error('[SupabaseServer] Failed to initialize Supabase server client:', err?.message || err);
      return null;
    }
  }

  return serverClient;
}

