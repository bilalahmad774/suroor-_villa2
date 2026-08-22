import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedUrl = '';
let cachedKey = '';
let serverClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient | null {
  const supabaseUrl = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  ).trim();

  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  ).trim();

  // Validate URL and Key
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
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
    } catch (err) {
      console.warn('[SupabaseServer] Failed to initialize Supabase server client:', err);
      return null;
    }
  }

  return serverClient;
}
