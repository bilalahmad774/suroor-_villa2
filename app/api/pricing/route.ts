import { NextResponse } from 'next/server';
import { AccommodationService } from '@/src/lib/accommodationService';
import { dataStore } from '@/src/lib/dataStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const accommodations = await AccommodationService.getAllAccommodations();
    const dynamicPricing = await AccommodationService.getPricingConfigFromDatabase();

    // Keep dataStore in sync with fresh database prices
    dataStore.syncAccommodations(accommodations);

    return NextResponse.json(
      {
        success: true,
        pricing: dynamicPricing,
        accommodations,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: any) {
    console.error('[API /api/pricing] Error loading database prices:', error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch accommodation pricing from Supabase.',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  }
}


