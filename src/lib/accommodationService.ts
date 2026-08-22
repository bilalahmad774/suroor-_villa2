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

export class AccommodationService {
  /**
   * Fetches all active accommodations directly from the Supabase public.accommodations table.
   * Never caches indefinitely so any database update in Supabase (e.g. room-1 = 100) is reflected immediately.
   * If Supabase credentials are not yet configured in environment variables, seamlessly uses default accommodations.
   */
  static async getAllAccommodations(): Promise<AccommodationRecord[]> {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return DEFAULT_ACCOMMODATIONS;
    }

    try {
      const { data, error } = await supabase
        .from('accommodations')
        .select('id, name, type, base_price_per_night, currency, capacity, is_active, updated_at')
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (error) {
        console.warn('[AccommodationService] Supabase accommodations query notice:', error.message);
        return DEFAULT_ACCOMMODATIONS;
      }

      if (!data || data.length === 0) {
        return DEFAULT_ACCOMMODATIONS;
      }

      const parsedRecords: AccommodationRecord[] = data.map((item: any) => {
        const rawPrice = Number(item.base_price_per_night);
        const validPrice = !isNaN(rawPrice) && rawPrice >= 0 ? rawPrice : 15000;

        return {
          id: String(item.id),
          name: String(item.name || item.id),
          type: String(item.type || 'standard'),
          base_price_per_night: validPrice,
          currency: String(item.currency || 'INR'),
          capacity: Number(item.capacity) || 2,
          is_active: Boolean(item.is_active),
          updated_at: item.updated_at,
        };
      });

      return parsedRecords;
    } catch (err: any) {
      console.warn('[AccommodationService] Error loading accommodations from Supabase:', err.message);
      return DEFAULT_ACCOMMODATIONS;
    }
  }

  /**
   * Retrieves a single active accommodation by ID from Supabase with full active status validation.
   */
  static async getAccommodationById(id: string): Promise<AccommodationRecord | null> {
    const normalizedId = id === 'entire-villa' || id === 'villa-suroor-main' ? 'entire-villa' : id;
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      const all = await this.getAllAccommodations();
      return all.find((a) => a.id === normalizedId && a.is_active) || null;
    }

    try {
      const { data, error } = await supabase
        .from('accommodations')
        .select('id, name, type, base_price_per_night, currency, capacity, is_active, updated_at')
        .eq('id', normalizedId)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        const all = await this.getAllAccommodations();
        return all.find((a) => a.id === normalizedId && a.is_active) || null;
      }

      const rawPrice = Number(data.base_price_per_night);
      const validPrice = !isNaN(rawPrice) && rawPrice >= 0 ? rawPrice : 15000;

      return {
        id: String(data.id),
        name: String(data.name || data.id),
        type: String(data.type || 'standard'),
        base_price_per_night: validPrice,
        currency: String(data.currency || 'INR'),
        capacity: Number(data.capacity) || 2,
        is_active: Boolean(data.is_active),
        updated_at: data.updated_at,
      };
    } catch (err: any) {
      const all = await this.getAllAccommodations();
      return all.find((a) => a.id === normalizedId && a.is_active) || null;
    }
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

    const entireVillaPrice = entireVilla ? Number(entireVilla.base_price_per_night) : 30000;
    const roomPriceDefault = room1 ? Number(room1.base_price_per_night) : (room2 ? Number(room2.base_price_per_night) : 15000);

    const roomPrices: Record<string, number> = {};
    accommodations.forEach((acc) => {
      if (acc.id !== 'entire-villa') {
        roomPrices[acc.id] = Number(acc.base_price_per_night);
      }
    });

    return {
      entireVillaPricePerNight: entireVillaPrice,
      roomPricePerNight: roomPriceDefault,
      currency: entireVilla?.currency || 'INR',
      currencySymbol: '₹',
      roomPrices: {
        'room-1': room1 ? Number(room1.base_price_per_night) : roomPriceDefault,
        'room-2': room2 ? Number(room2.base_price_per_night) : roomPriceDefault,
        'room-3': room3 ? Number(room3.base_price_per_night) : roomPriceDefault,
        ...roomPrices,
      },
    };
  }

  /**
   * Updates an accommodation price in the Supabase accommodations table.
   */
  static async updateAccommodationPrice(id: string, newPrice: number): Promise<boolean> {
    const normalizedId = id === 'entire-villa' || id === 'villa-suroor-main' ? 'entire-villa' : id;
    const supabase = getSupabaseServerClient();

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
}
