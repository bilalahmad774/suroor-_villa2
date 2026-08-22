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

export class AccommodationService {
  /**
   * Fetches all active accommodations directly from Supabase public.accommodations table.
   * Explicitly selects id, name, type, base_price_per_night, currency, capacity, is_active, updated_at.
   */
  static async getAllAccommodations(): Promise<AccommodationRecord[]> {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('accommodations')
        .select('id, name, type, base_price_per_night, currency, capacity, is_active, updated_at')
        .order('id', { ascending: true });

      if (error) {
        console.warn('[AccommodationService] Supabase accommodations query error:', error.message);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      const parsedRecords: AccommodationRecord[] = data.map((item: any) => {
        const rawPrice = Number(item.base_price_per_night);
        const validPrice = !isNaN(rawPrice) ? rawPrice : 0;

        return {
          id: String(item.id),
          name: String(item.name || item.id),
          type: String(item.type || 'standard'),
          base_price_per_night: validPrice,
          currency: String(item.currency || 'INR'),
          capacity: Number(item.capacity) || 2,
          is_active: item.is_active !== false,
          updated_at: item.updated_at,
        };
      });

      return parsedRecords;
    } catch (err: any) {
      console.warn('[AccommodationService] Error loading accommodations from Supabase:', err.message);
      return [];
    }
  }

  /**
   * Retrieves a single active accommodation by ID from Supabase with full active status validation.
   * Maps 'room-1' -> The Master Suite, 'room-2' -> The Pine Suite, 'room-3' -> The Garden Room, 'entire-villa' -> Entire Villa.
   */
  static async getAccommodationById(id: string): Promise<AccommodationRecord | null> {
    const normalizedId = id === 'entire-villa' || id === 'villa-suroor-main' ? 'entire-villa' : id;
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('accommodations')
        .select('id, name, type, base_price_per_night, currency, capacity, is_active, updated_at')
        .eq('id', normalizedId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      const rawPrice = Number(data.base_price_per_night);
      const validPrice = !isNaN(rawPrice) ? rawPrice : 0;

      return {
        id: String(data.id),
        name: String(data.name || data.id),
        type: String(data.type || 'standard'),
        base_price_per_night: validPrice,
        currency: String(data.currency || 'INR'),
        capacity: Number(data.capacity) || 2,
        is_active: data.is_active !== false,
        updated_at: data.updated_at,
      };
    } catch (err: any) {
      console.warn('[AccommodationService] Error loading accommodation by id:', err.message);
      return null;
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

    const roomPrices: Record<string, number> = {};
    accommodations.forEach((acc) => {
      roomPrices[acc.id] = Number(acc.base_price_per_night);
    });

    const entireVillaPrice = entireVilla
      ? Number(entireVilla.base_price_per_night)
      : (roomPrices['entire-villa'] ?? 0);

    const roomPriceDefault = room1
      ? Number(room1.base_price_per_night)
      : (room2 ? Number(room2.base_price_per_night) : (room3 ? Number(room3.base_price_per_night) : 0));

    return {
      entireVillaPricePerNight: entireVillaPrice,
      roomPricePerNight: roomPriceDefault,
      currency: entireVilla?.currency || 'INR',
      currencySymbol: '₹',
      roomPrices: {
        'room-1': room1 ? Number(room1.base_price_per_night) : (roomPrices['room-1'] ?? 0),
        'room-2': room2 ? Number(room2.base_price_per_night) : (roomPrices['room-2'] ?? 0),
        'room-3': room3 ? Number(room3.base_price_per_night) : (roomPrices['room-3'] ?? 0),
        'entire-villa': entireVillaPrice,
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
