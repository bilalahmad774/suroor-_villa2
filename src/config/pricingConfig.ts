/**
 * Centralized Pricing Type Definitions & Mapping Helpers for Suroor Villa.
 * Authoritative rates are stored in the Supabase public.accommodations table (base_price_per_night).
 */

export interface PricingConfig {
  roomPricePerNight: number;
  entireVillaPricePerNight: number;
  currency: string;
  currencySymbol: string;
  roomPrices: Record<string, number>;
}

export const defaultPricingConfig: PricingConfig = {
  roomPricePerNight: 0,
  entireVillaPricePerNight: 0,
  currency: 'INR',
  currencySymbol: '₹',
  roomPrices: {},
};

/**
 * Get room price per night for a given room ID from a loaded PricingConfig object.
 */
export function getRoomPrice(roomId?: string, config?: PricingConfig): number {
  if (!config) return 0;
  if (!roomId || roomId === 'entire-villa' || roomId === 'villa-suroor-main') {
    return config.entireVillaPricePerNight || config.roomPrices['entire-villa'] || 0;
  }
  return config.roomPrices[roomId] || config.roomPricePerNight || 0;
}

/**
 * Get entire villa price per night from a loaded PricingConfig object.
 */
export function getEntireVillaPrice(config?: PricingConfig): number {
  if (!config) return 0;
  return config.entireVillaPricePerNight || config.roomPrices['entire-villa'] || 0;
}

/**
 * Format human-readable accommodation title.
 */
export function getAccommodationTitle(roomId?: string): string {
  if (!roomId || roomId === 'entire-villa' || roomId === 'villa-suroor-main') {
    return 'Entire Villa';
  }
  switch (roomId) {
    case 'room-1':
      return 'The Master Suite';
    case 'room-2':
      return 'The Pine Suite';
    case 'room-3':
      return 'The Garden Room';
    default:
      return 'Private Suite';
  }
}
