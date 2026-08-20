import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/src/lib/dataStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { villaId = 'villa-suroor-main', checkIn, checkOut, roomId } = body;

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'checkIn and checkOut dates are required.' },
        { status: 400 }
      );
    }

    const result = await dataStore.checkAvailability(villaId, checkIn, checkOut, roomId);
    const ranges = await dataStore.getBookedDateRanges(villaId, roomId);

    return NextResponse.json({
      ...result,
      ...ranges,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Availability check failed.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const villaId = searchParams.get('villaId') || 'villa-suroor-main';
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const roomId = searchParams.get('roomId') || undefined;

    const ranges = await dataStore.getBookedDateRanges(villaId, roomId);

    if (!checkIn || !checkOut) {
      return NextResponse.json({
        success: true,
        villaId,
        ...ranges,
      });
    }

    const result = await dataStore.checkAvailability(villaId, checkIn, checkOut, roomId);
    return NextResponse.json({
      ...result,
      ...ranges,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Availability query failed.' }, { status: 500 });
  }
}
