import { NextRequest, NextResponse } from 'next/server';
import { dataStore, memStore } from '@/lib/dataStore';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;

    const bookings = await dataStore.listBookings({ search, status });
    return NextResponse.json({ success: true, bookings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching bookings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { bookingId, status, internalNotes, notes } = body;

    const booking = memStore.bookings.find(
      (b) => b.id === bookingId || b.referenceCode === bookingId
    );
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (status) booking.status = status;
    if (internalNotes !== undefined) booking.internalNotes = internalNotes;
    if (notes !== undefined) booking.notes = notes;

    booking.updatedAt = new Date().toISOString();

    dataStore.addAuditLog({
      userId: user.id,
      action: 'UPDATE_BOOKING_ADMIN',
      entity: 'Booking',
      entityId: booking.id,
      details: `Updated booking ${booking.referenceCode}. Status: ${status || booking.status}`,
    });

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
  }
}
