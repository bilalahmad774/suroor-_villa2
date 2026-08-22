import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { villaId = 'villa-suroor-main', checkIn, checkOut, guestCount = 2, couponCode, roomId } = body;

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'checkIn and checkOut dates are required.' },
        { status: 400 }
      );
    }

    const quote = await dataStore.getPricingQuote({
      villaId,
      checkIn,
      checkOut,
      guestCount: Number(guestCount),
      couponCode,
      roomId,
    });

    return NextResponse.json(quote);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Pricing quote calculation failed.' }, { status: 500 });
  }
}
