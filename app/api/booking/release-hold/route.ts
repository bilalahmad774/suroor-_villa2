import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/src/lib/dataStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking ID.' }, { status: 400 });
    }

    const released = await dataStore.releaseBookingHold(bookingId);
    if (!released) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Temporary hold released successfully.',
      bookingId: released.id,
      status: released.status,
    });
  } catch (err: any) {
    console.error('Release Hold Error:', err);
    return NextResponse.json({ error: err.message || 'Server error releasing hold.' }, { status: 500 });
  }
}
