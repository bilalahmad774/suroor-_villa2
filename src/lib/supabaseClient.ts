import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { normalizeSupabaseUrl } from './supabaseUtils';

let browserClient: SupabaseClient | null = null;
let hasLoggedMissingBrowserEnv = false;

/**
 * Checks whether required public Supabase environment variables are present and valid.
 */
export function isSupabaseConfigured(): boolean {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key && !key.toLowerCase().includes('placeholder'));
}

/**
 * Returns the singleton browser SupabaseClient or null if credentials are unconfigured.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const url = normalizeSupabaseUrl(rawUrl);
  const key = rawKey?.trim();

  if (!url || !key || key.toLowerCase().includes('placeholder')) {
    if (!hasLoggedMissingBrowserEnv && typeof window !== 'undefined') {
      console.warn(
        '[SupabaseClient] Supabase browser environment variables are not configured. ' +
        'Expected NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      );
      hasLoggedMissingBrowserEnv = true;
    }
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
  }

  return browserClient;
}

/**
 * Safe client instance proxy.
 * If credentials are configured, delegates operations to the authenticated Supabase client.
 * If credentials are missing, throws a clear descriptive error to prevent unintended requests
 * to fake placeholder endpoints.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseBrowserClient();
    if (!client) {
      if (prop === 'then') return undefined; // Avoid treating proxy as an unresolved thenable
      throw new Error(
        '[SupabaseClient] Supabase client is not configured. Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables.'
      );
    }
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export type { User } from '@supabase/supabase-js';

