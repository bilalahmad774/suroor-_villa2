import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/src/lib/paymentService';
import { dataStore } from '@/src/lib/dataStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bookingId,
      gateway = 'razorpay',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      stripePaymentIntentId,
    } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required.' }, { status: 400 });
    }

    const booking = dataStore.getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking record not found.' }, { status: 404 });
    }

    // Verify signature with real gateway
    const verifyResult = await PaymentService.verifyPayment({
      bookingId: booking.id,
      gateway: gateway === 'stripe' ? 'stripe' : 'razorpay',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      stripePaymentIntentId,
    });

    if (!verifyResult.success) {
      return NextResponse.json({ error: verifyResult.error || 'Payment verification failed.' }, { status: 400 });
    }

    const result = await dataStore.confirmPaymentAndBooking({
      bookingId: booking.id,
      transactionId: verifyResult.transactionId,
      method: verifyResult.method,
      amount: booking.totalAmount,
      gatewayResponse: body,
    });

    return NextResponse.json({
      success: true,
      booking: result.booking,
      payment: result.payment,
      invoice: result.invoice,
      message: 'Payment verified and booking confirmed successfully!',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payment verification failed.' }, { status: 400 });
  }
}
