import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { getSessionUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const bookingId = resolvedParams?.id;
    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }
    const booking = await dataStore.getBooking(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching booking' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const bookingId = resolvedParams?.id;
    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }
    const user = await getSessionUser();
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || 'GUEST_REQUEST';
    const notes = body.notes || 'Cancelled by guest.';

    const result = await dataStore.cancelBooking(
      bookingId,
      reason,
      notes,
      user?.id || 'GUEST'
    );

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully.',
      cancellation: result.cancellation,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to cancel booking' }, { status: 400 });
  }
}
