import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/src/lib/paymentService';
import { dataStore } from '@/src/lib/dataStore';
import { EmailService } from '@/src/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const isValid = PaymentService.verifyWebhookSignature(rawBody, signature, webhookSecret, 'razorpay');
      if (!isValid) {
        console.error('[RAZORPAY WEBHOOK] Invalid signature signature check failed.');
        return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventId = event.event_id || event.payload?.payment?.entity?.id || `rzp_${Date.now()}`;

    // Idempotency check
    if (PaymentService.isProcessed(`webhook_${eventId}`)) {
      return NextResponse.json({ status: 'already_processed' });
    }
    PaymentService.markProcessed(`webhook_${eventId}`);

    const eventType = event.event;
    console.log(`[RAZORPAY WEBHOOK] Event Received: ${eventType}`);

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      const notes = paymentEntity?.notes || {};
      const bookingId = notes.bookingId;

      if (bookingId) {
        const booking = dataStore.getBookingById(bookingId);
        if (booking && booking.status !== 'CONFIRMED') {
          await dataStore.confirmPaymentAndBooking({
            bookingId: booking.id,
            transactionId: paymentEntity.id,
            method: 'RAZORPAY_WEBHOOK',
            amount: paymentEntity.amount / 100,
            gatewayResponse: paymentEntity,
          });

          // Dispatch confirmation email
          await EmailService.sendPaymentConfirmation({
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            referenceCode: booking.referenceCode,
            paidAmount: paymentEntity.amount / 100,
            transactionId: paymentEntity.id,
            paymentMethod: 'Razorpay',
          });
        }
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = event.payload?.payment?.entity;
      const notes = paymentEntity?.notes || {};
      console.warn(`[RAZORPAY WEBHOOK] Payment failed for booking ${notes.bookingId}`);
    }

    return NextResponse.json({ status: 'success' });
  } catch (err: any) {
    console.error('[RAZORPAY WEBHOOK] Error:', err);
    return NextResponse.json({ error: err.message || 'Webhook processing error.' }, { status: 500 });
  }
}
