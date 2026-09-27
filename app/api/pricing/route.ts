import { NextResponse } from 'next/server';
import { AccommodationService } from '@/src/lib/accommodationService';
import { dataStore } from '@/src/lib/dataStore';
import { getSupabaseServerClient } from '@/src/lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const accommodations = await AccommodationService.getAllAccommodations();
    if (accommodations.length === 0) {
      console.warn('[API /api/pricing] No active accommodation records found.');
      return NextResponse.json(
        {
          success: false,
          error: 'No active accommodations found.',
          accommodations: [],
          pricing: null,
        },
        {
          status: 404,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

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


