import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/src/lib/paymentService';
import { dataStore } from '@/src/lib/dataStore';
import { EmailService } from '@/src/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature') || '';
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    if (webhookSecret) {
      const isValid = PaymentService.verifyWebhookSignature(rawBody, signature, webhookSecret, 'stripe');
      if (!isValid) {
        console.error('[STRIPE WEBHOOK] Signature verification failed.');
        return NextResponse.json({ error: 'Invalid Stripe signature.' }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventId = event.id || `strp_${Date.now()}`;

    // Idempotency check
    if (PaymentService.isProcessed(`webhook_${eventId}`)) {
      return NextResponse.json({ status: 'already_processed' });
    }
    PaymentService.markProcessed(`webhook_${eventId}`);

    const eventType = event.type;
    console.log(`[STRIPE WEBHOOK] Event Received: ${eventType}`);

    if (eventType === 'payment_intent.succeeded') {
      const paymentIntent = event.data?.object;
      const metadata = paymentIntent?.metadata || {};
      const bookingId = metadata.bookingId;

      if (bookingId) {
        const booking = dataStore.getBookingById(bookingId);
        if (booking && booking.status !== 'CONFIRMED') {
          await dataStore.confirmPaymentAndBooking({
            bookingId: booking.id,
            transactionId: paymentIntent.id,
            method: 'STRIPE_WEBHOOK',
            amount: paymentIntent.amount / 100,
            gatewayResponse: paymentIntent,
          });

          await EmailService.sendPaymentConfirmation({
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            referenceCode: booking.referenceCode,
            paidAmount: paymentIntent.amount / 100,
            transactionId: paymentIntent.id,
            paymentMethod: 'Stripe Card',
          });
        }
      }
    } else if (eventType === 'payment_intent.payment_failed') {
      console.warn(`[STRIPE WEBHOOK] Payment failed for intent ${event.data?.object?.id}`);
    }

    return NextResponse.json({ status: 'success' });
  } catch (err: any) {
    console.error('[STRIPE WEBHOOK] Error:', err);
    return NextResponse.json({ error: err.message || 'Webhook processing error.' }, { status: 500 });
  }
}
