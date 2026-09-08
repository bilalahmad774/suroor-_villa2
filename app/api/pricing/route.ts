import { NextResponse } from 'next/server';
import { AccommodationService } from '@/src/lib/accommodationService';
import { dataStore } from '@/src/lib/dataStore';
import { getSupabaseServerClient } from '@/src/lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      console.error(
        '[API /api/pricing] Production database is unavailable: Supabase credentials are not configured in environment variables.'
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Pricing service is temporarily unavailable: production database is not configured.',
          accommodations: [],
          pricing: null,
        },
        {
          status: 503,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    const accommodations = await AccommodationService.getAllAccommodations();
    if (accommodations.length === 0) {
      console.warn('[API /api/pricing] No active accommodation records found in public.accommodations table.');
      return NextResponse.json(
        {
          success: false,
          error: 'No active accommodations found in the database.',
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


