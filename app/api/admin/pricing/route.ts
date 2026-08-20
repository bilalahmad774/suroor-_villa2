import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/src/lib/dataStore';
import { getSessionUser } from '@/src/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const pricing = dataStore.getPricingConfig();
    return NextResponse.json({
      success: true,
      pricing,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch admin pricing config' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const updated = await dataStore.updatePricingConfig({
      roomPricePerNight: body.roomPricePerNight ? Number(body.roomPricePerNight) : undefined,
      entireVillaPricePerNight: body.entireVillaPricePerNight ? Number(body.entireVillaPricePerNight) : undefined,
      roomPrices: body.roomPrices,
    });

    return NextResponse.json({
      success: true,
      message: 'Pricing configuration successfully updated and saved.',
      pricing: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update pricing config' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return PUT(req);
}
