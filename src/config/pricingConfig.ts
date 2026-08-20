/**
 * Centralized Pricing Configuration for Suroor Villa
 * Single source of truth for accommodation rates and pricing logic.
 *
 * To change prices, update this file or update via the Admin Settings Dashboard.
 * Changing prices here automatically updates:
 * - Room cards
 * - Room details modal
 * - Reservation/booking page
 * - Booking modal
 * - Guest Information step
 * - Payment gateway amount
 * - Admin booking records & invoices
 */

export interface PricingConfig {
  roomPricePerNight: number;
  entireVillaPricePerNight: number;
  currency: string;
  currencySymbol: string;
  roomPrices: Record<string, number>;
}

export const defaultPricingConfig: PricingConfig = {
  roomPricePerNight: 15000,
  entireVillaPricePerNight: 30000,
  currency: 'INR',
  currencySymbol: '₹',
  roomPrices: {
    'room-1': 15000, // The Master Suite
    'room-2': 15000, // The Pine Suite
    'room-3': 15000, // The Garden Room
  },
};

/**
 * Get room price per night for a given room ID, falling back to centralized room price.
 */
export function getRoomPrice(roomId?: string, config: PricingConfig = defaultPricingConfig): number {
  if (!roomId || roomId === 'entire-villa') {
    return config.entireVillaPricePerNight;
  }
  return config.roomPrices[roomId] || config.roomPricePerNight;
}

/**
 * Get entire villa price per night.
 */
export function getEntireVillaPrice(config: PricingConfig = defaultPricingConfig): number {
  return config.entireVillaPricePerNight;
}

/**
 * Format human-readable accommodation title.
 */
export function getAccommodationTitle(roomId?: string): string {
  if (!roomId || roomId === 'entire-villa') {
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
