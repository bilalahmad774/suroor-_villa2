/**
 * Normalizes and validates a Supabase project URL.
 * - Ensures valid protocol (https://)
 * - Strips any trailing /rest/v1 or /rest/v1/ suffix (which PostgREST appends automatically)
 * - Strips trailing slashes
 * - Strictly rejects empty or placeholder URLs (such as placeholder.supabase.co)
 */
export function normalizeSupabaseUrl(rawUrl?: string | null): string {
  if (!rawUrl) return '';
  let trimmed = rawUrl.trim();
  if (!trimmed || trimmed.toLowerCase().includes('placeholder')) return '';

  // Prepend https:// if protocol is omitted
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    const pathnameWithoutRest = parsed.pathname
      .replace(/\/rest\/v1\/?$/i, '')
      .replace(/\/+$/, '');

    if (!pathnameWithoutRest || pathnameWithoutRest === '/') {
      return parsed.origin;
    }
    return `${parsed.origin}${pathnameWithoutRest}`;
  } catch {
    return trimmed.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
  }
}
