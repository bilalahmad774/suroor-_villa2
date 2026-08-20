import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/src/lib/paymentService';
import { dataStore } from '@/src/lib/dataStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, gateway } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking ID.' }, { status: 400 });
    }

    const booking = dataStore.getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking record not found.' }, { status: 404 });
    }

    if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') {
      return NextResponse.json({ error: 'This booking hold has been cancelled or expired.' }, { status: 400 });
    }

    if (booking.status === 'CONFIRMED') {
      return NextResponse.json({ error: 'Booking is already paid and confirmed.' }, { status: 400 });
    }

    // Check temporary lock expiration
    if (booking.status === 'PENDING' && booking.lockExpiresAt) {
      if (new Date(booking.lockExpiresAt).getTime() < Date.now()) {
        return NextResponse.json(
          { error: 'Temporary reservation hold has expired (15 min window). Please choose your dates again.' },
          { status: 400 }
        );
      }
    }

    // Determine primary guest contact
    const primaryGuest = (booking as any).primaryGuest || {};
    const guestName = primaryGuest.fullName || booking.customerName || 'Guest';
    const guestEmail = primaryGuest.email || booking.customerEmail || 'guest@example.com';
    const guestPhone = primaryGuest.phone || booking.customerPhone || '';

    // Call unified payment service with server-calculated amount
    const orderResult = await PaymentService.createOrder({
      bookingId: booking.id,
      amount: booking.totalAmount,
      currency: 'INR',
      customerName: guestName,
      customerEmail: guestEmail,
      customerPhone: guestPhone,
      gateway: gateway || 'razorpay',
      idempotencyKey: `order_${booking.id}_${Date.now()}`,
    });

    if (!orderResult.success) {
      return NextResponse.json({ error: orderResult.error || 'Failed to create payment order.' }, { status: 400 });
    }

    return NextResponse.json(orderResult);
  } catch (err: any) {
    console.error('Create Order Error:', err);
    return NextResponse.json({ error: err.message || 'Server error creating order.' }, { status: 500 });
  }
}

