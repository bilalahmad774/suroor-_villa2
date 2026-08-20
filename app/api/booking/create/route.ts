import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    const body = await req.json();

    const {
      villaId = 'villa-suroor-main',
      roomId,
      checkIn,
      checkOut,
      guestCount = 2,
      adults = 1,
      children = 0,
      primaryGuest,
      additionalGuests,
      notes,
      couponCode,
    } = body;

    if (!checkIn || !checkOut) {
      return NextResponse.json({ error: 'Check-in and check-out dates are required.' }, { status: 400 });
    }

    if (!primaryGuest || !primaryGuest.fullName || !primaryGuest.email || !primaryGuest.phone) {
      return NextResponse.json(
        { error: 'Primary guest name, email, and phone number are required.' },
        { status: 400 }
      );
    }

    const result = await dataStore.createBooking({
      villaId,
      roomId,
      checkIn,
      checkOut,
      guestCount: Number(guestCount),
      adults: Number(adults),
      children: Number(children),
      primaryGuest,
      additionalGuests,
      notes,
      couponCode,
      userId: sessionUser?.id,
    });

    return NextResponse.json({
      success: true,
      booking: result.booking,
      primaryGuest: result.primaryGuest,
      quote: result.quote,
      lockExpiresAt: result.booking.lockExpiresAt,
      message: 'Temporary booking hold created. Please complete payment within 15 minutes to confirm.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Booking creation failed.' }, { status: 400 });
  }
}
