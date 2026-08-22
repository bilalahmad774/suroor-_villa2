import { NextResponse } from 'next/server';
import { AccommodationService } from '@/src/lib/accommodationService';
import { dataStore } from '@/src/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const accommodations = await AccommodationService.getAllAccommodations();
    const dynamicPricing = await AccommodationService.getPricingConfigFromDatabase();

    // Keep dataStore in sync
    dataStore.syncAccommodations(accommodations);

    return NextResponse.json({
      success: true,
      pricing: dynamicPricing,
      accommodations,
    });
  } catch (error: any) {
    console.error('[API /api/pricing] Error loading prices:', error);
    // Graceful fallback to in-memory store
    const fallbackConfig = dataStore.getPricingConfig();
    return NextResponse.json({
      success: true,
      pricing: fallbackConfig,
      accommodations: [
        { id: 'entire-villa', name: 'Entire Villa (All 3 Suites)', type: 'buyout', base_price_per_night: fallbackConfig.entireVillaPricePerNight, currency: 'INR', capacity: 6, is_active: true },
        { id: 'room-1', name: 'The Master Suite', type: 'master', base_price_per_night: fallbackConfig.roomPrices['room-1'], currency: 'INR', capacity: 2, is_active: true },
        { id: 'room-2', name: 'The Pine Suite', type: 'deluxe', base_price_per_night: fallbackConfig.roomPrices['room-2'], currency: 'INR', capacity: 2, is_active: true },
        { id: 'room-3', name: 'The Garden Room', type: 'garden', base_price_per_night: fallbackConfig.roomPrices['room-3'], currency: 'INR', capacity: 2, is_active: true },
      ],
    });
  }
}

