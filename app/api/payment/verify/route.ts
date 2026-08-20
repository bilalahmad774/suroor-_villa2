import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/src/lib/paymentService';
import { dataStore } from '@/src/lib/dataStore';
import { EmailService } from '@/src/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bookingId,
      gateway,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      stripePaymentIntentId,
    } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking ID.' }, { status: 400 });
    }

    const booking = dataStore.getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking record not found.' }, { status: 404 });
    }

    // Check if booking was cancelled or refunded
    if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') {
      return NextResponse.json(
        { error: 'This booking hold has been cancelled or expired. Payment cannot be verified.' },
        { status: 400 }
      );
    }

    // Idempotent duplicate check
    const incomingTxnId = razorpayPaymentId || stripePaymentIntentId || '';
    if (!incomingTxnId) {
      return NextResponse.json({ error: 'Missing payment transaction ID for verification.' }, { status: 400 });
    }

    if (booking.status === 'CONFIRMED') {
      if (booking.paymentTransactionId === incomingTxnId || booking.paymentStatus === 'PAID') {
        return NextResponse.json({
          success: true,
          message: 'Payment already verified and booking confirmed.',
          referenceCode: booking.referenceCode,
          transactionId: booking.paymentTransactionId || incomingTxnId,
          status: booking.status,
        });
      }
      return NextResponse.json(
        { error: 'This reservation is already confirmed and paid under another transaction.' },
        { status: 400 }
      );
    }

    // 1. Verify Payment Signature & Status Server-Side
    const verifyResult = await PaymentService.verifyPayment({
      bookingId: booking.id,
      gateway: gateway === 'stripe' ? 'stripe' : 'razorpay',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      stripePaymentIntentId,
      idempotencyKey: `verify_${booking.id}_${incomingTxnId}`,
    });

    if (!verifyResult.success) {
      return NextResponse.json(
        { error: verifyResult.error || 'Payment verification failed. Potential security issue.' },
        { status: 400 }
      );
    }

    // 2. Confirm Booking and Record Payment in Database ONLY AFTER verified payment
    const { booking: confirmedBooking, payment } = await dataStore.confirmPaymentAndBooking({
      bookingId: booking.id,
      transactionId: verifyResult.transactionId,
      method: verifyResult.method,
      amount: booking.totalAmount,
      gatewayResponse: body,
    });

    // 3. Dispatch Emails Asynchronously
    try {
      const primaryGuest = (booking as any).primaryGuest || {};
      const guestName = primaryGuest.fullName || booking.customerName || 'Guest';
      const guestEmail = primaryGuest.email || booking.customerEmail || 'guest@example.com';

      const emailPayload = {
        customerName: guestName,
        customerEmail: guestEmail,
        bookingId: booking.id,
        referenceCode: booking.referenceCode,
        checkIn: new Date(booking.checkIn).toLocaleDateString('en-IN', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        checkOut: new Date(booking.checkOut).toLocaleDateString('en-IN', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        guestCount: booking.guestCount,
        totalAmount: booking.totalAmount,
        paidAmount: booking.totalAmount,
        transactionId: verifyResult.transactionId,
        paymentMethod: verifyResult.method,
      };

      await Promise.all([
        EmailService.sendBookingConfirmation(emailPayload),
        EmailService.sendPaymentConfirmation(emailPayload),
        EmailService.sendInvoiceEmail(emailPayload),
        EmailService.sendAdminNotification(emailPayload),
      ]);
    } catch (e) {
      console.error('Non-blocking error dispatching confirmation emails:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and booking confirmed successfully.',
      referenceCode: confirmedBooking.referenceCode,
      transactionId: payment.transactionId,
      status: confirmedBooking.status,
    });
  } catch (err: any) {
    console.error('Payment Verification Error:', err);
    return NextResponse.json(
      { error: err.message || 'Server error during payment verification.' },
      { status: 500 }
    );
  }
}

