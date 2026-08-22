import { getSupabaseServerClient } from './supabaseServer';
import type { PricingConfig } from '@/config/pricingConfig';

export interface AccommodationRecord {
  id: string; // 'entire-villa' | 'room-1' | 'room-2' | 'room-3'
  name: string;
  type: string;
  base_price_per_night: number;
  currency: string;
  capacity: number;
  is_active: boolean;
  updated_at?: string;
}

export const DEFAULT_ACCOMMODATIONS: AccommodationRecord[] = [
  {
    id: 'entire-villa',
    name: 'Entire Villa (All 3 Suites)',
    type: 'buyout',
    base_price_per_night: 30000,
    currency: 'INR',
    capacity: 6,
    is_active: true,
  },
  {
    id: 'room-1',
    name: 'The Master Suite',
    type: 'master',
    base_price_per_night: 15000,
    currency: 'INR',
    capacity: 2,
    is_active: true,
  },
  {
    id: 'room-2',
    name: 'The Pine Suite',
    type: 'deluxe',
    base_price_per_night: 15000,
    currency: 'INR',
    capacity: 2,
    is_active: true,
  },
  {
    id: 'room-3',
    name: 'The Garden Room',
    type: 'garden',
    base_price_per_night: 15000,
    currency: 'INR',
    capacity: 2,
    is_active: true,
  },
];

// In-memory cache for fast sub-millisecond response times
interface CacheEntry {
  data: AccommodationRecord[];
  timestamp: number;
}

let cachedAccommodations: CacheEntry | null = null;
const CACHE_TTL_MS = 15000; // 15 seconds TTL

export class AccommodationService {
  /**
   * Clears the in-memory cache so subsequent reads query fresh Supabase records
   */
  static invalidateCache() {
    cachedAccommodations = null;
  }

  /**
   * Fetches all active accommodations from the Supabase public.accommodations table.
   * Falls back gracefully to default seed configuration if Supabase is offline or unconfigured.
   */
  static async getAllAccommodations(forceFresh = false): Promise<AccommodationRecord[]> {
    const now = Date.now();
    if (!forceFresh && cachedAccommodations && now - cachedAccommodations.timestamp < CACHE_TTL_MS) {
      return cachedAccommodations.data;
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      // Supabase is not configured yet - return reliable default seeds
      return DEFAULT_ACCOMMODATIONS;
    }

    try {
      const { data, error } = await supabase
        .from('accommodations')
        .select('id, name, type, base_price_per_night, currency, capacity, is_active, updated_at')
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (error) {
        console.warn('[AccommodationService] Supabase query notice:', error.message);
        // If table doesn't exist yet, return defaults
        return DEFAULT_ACCOMMODATIONS;
      }

      if (!data || data.length === 0) {
        // Table exists but is empty; attempt to seed if possible
        await this.seedAccommodationsIfEmpty();
        return DEFAULT_ACCOMMODATIONS;
      }

      const parsedRecords: AccommodationRecord[] = data.map((item: any) => ({
        id: String(item.id),
        name: String(item.name || item.id),
        type: String(item.type || 'standard'),
        base_price_per_night: Number(item.base_price_per_night) || 15000,
        currency: String(item.currency || 'INR'),
        capacity: Number(item.capacity) || 2,
        is_active: Boolean(item.is_active),
        updated_at: item.updated_at,
      }));

      cachedAccommodations = {
        data: parsedRecords,
        timestamp: now,
      };

      return parsedRecords;
    } catch (err: any) {
      console.error('[AccommodationService] Error querying Supabase accommodations:', err.message);
      return DEFAULT_ACCOMMODATIONS;
    }
  }

  /**
   * Retrieves a single accommodation by ID from Supabase with full type and active status validation.
   */
  static async getAccommodationById(id: string): Promise<AccommodationRecord | null> {
    const normalizedId = id === 'entire-villa' || id === 'villa-suroor-main' ? 'entire-villa' : id;
    const all = await this.getAllAccommodations();
    const found = all.find((a) => a.id === normalizedId && a.is_active);

    if (found) return found;

    // Fallback search in DEFAULT_ACCOMMODATIONS
    const fallback = DEFAULT_ACCOMMODATIONS.find((a) => a.id === normalizedId && a.is_active);
    return fallback || null;
  }

  /**
   * Builds the centralized PricingConfig object dynamically from Supabase database rows.
   */
  static async getPricingConfigFromDatabase(): Promise<PricingConfig> {
    const accommodations = await this.getAllAccommodations();

    const entireVilla = accommodations.find((a) => a.id === 'entire-villa');
    const room1 = accommodations.find((a) => a.id === 'room-1');
    const room2 = accommodations.find((a) => a.id === 'room-2');
    const room3 = accommodations.find((a) => a.id === 'room-3');

    const entireVillaPrice = entireVilla?.base_price_per_night ?? 30000;
    const roomPriceDefault = room1?.base_price_per_night ?? 15000;

    return {
      entireVillaPricePerNight: entireVillaPrice,
      roomPricePerNight: roomPriceDefault,
      currency: 'INR',
      currencySymbol: '₹',
      roomPrices: {
        'room-1': room1?.base_price_per_night ?? 15000,
        'room-2': room2?.base_price_per_night ?? 15000,
        'room-3': room3?.base_price_per_night ?? 15000,
      },
    };
  }

  /**
   * Updates an accommodation price in the Supabase accommodations table.
   */
  static async updateAccommodationPrice(id: string, newPrice: number): Promise<boolean> {
    const normalizedId = id === 'entire-villa' || id === 'villa-suroor-main' ? 'entire-villa' : id;
    const supabase = getSupabaseServerClient();

    this.invalidateCache();

    if (!supabase) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('accommodations')
        .update({
          base_price_per_night: newPrice,
          updated_at: new Date().toISOString(),
        })
        .eq('id', normalizedId);

      if (error) {
        console.error('[AccommodationService] Failed to update price in Supabase:', error.message);
        return false;
      }

      return true;
    } catch (err: any) {
      console.error('[AccommodationService] Error during Supabase price update:', err.message);
      return false;
    }
  }

  /**
   * Auto-seeds the accommodations table if connected and empty
   */
  static async seedAccommodationsIfEmpty() {
    const supabase = getSupabaseServerClient();
    if (!supabase) return;

    try {
      const { data: existing } = await supabase
        .from('accommodations')
        .select('id')
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from('accommodations').upsert(
          DEFAULT_ACCOMMODATIONS.map((item) => ({
            id: item.id,
            name: item.name,
            type: item.type,
            base_price_per_night: item.base_price_per_night,
            currency: item.currency,
            capacity: item.capacity,
            is_active: item.is_active,
            updated_at: new Date().toISOString(),
          })),
          { onConflict: 'id' }
        );
      }
    } catch (err: any) {
      // Non-blocking catch
      console.warn('[AccommodationService] Auto-seed check notice:', err.message);
    }
  }
}
