import { NextResponse } from 'next/server';
import { dataStore } from '@/src/lib/dataStore';

export async function GET() {
  try {
    const config = dataStore.getPricingConfig();
    return NextResponse.json({
      success: true,
      pricing: config,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch pricing config' },
      { status: 500 }
    );
  }
}
