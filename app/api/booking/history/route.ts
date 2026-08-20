import { NextRequest, NextResponse } from 'next/server';
import { dataStore, memStore } from '@/lib/dataStore';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get('email') || '').trim().toLowerCase();
    const refCode = (searchParams.get('referenceCode') || searchParams.get('ref') || '').trim().toUpperCase();

    if (user) {
      let userBookings = await dataStore.listBookings({ userId: user.id });
      if (userBookings.length === 0 && user.email) {
        userBookings = await dataStore.listBookings({ search: user.email });
      }
      return NextResponse.json({ success: true, bookings: userBookings });
    }

    if (email) {
      const bookings = memStore.bookings
        .filter((b) => {
          const guest = memStore.guests.find((g) => g.bookingId === b.id && g.isPrimary);
          return guest?.email.toLowerCase() === email || b.userId === email;
        })
        .map((b) => {
          const guest = memStore.guests.find((g) => g.bookingId === b.id && g.isPrimary);
          return { ...b, primaryGuest: guest };
        });

      return NextResponse.json({ success: true, bookings });
    }

    if (refCode) {
      const booking = memStore.bookings.find((b) => b.referenceCode.toUpperCase() === refCode);
      if (booking) {
        const guest = memStore.guests.find((g) => g.bookingId === booking.id && g.isPrimary);
        return NextResponse.json({ success: true, bookings: [{ ...booking, primaryGuest: guest }] });
      }
      return NextResponse.json({ success: true, bookings: [] });
    }

    return NextResponse.json({ success: true, bookings: [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch booking history.' }, { status: 500 });
  }
}

