import crypto from 'crypto';

export interface CreateOrderParams {
  bookingId: string;
  amount: number; // In INR
  currency?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  gateway?: 'razorpay' | 'stripe';
  idempotencyKey?: string;
}

export interface OrderResult {
  success: boolean;
  gateway: 'razorpay' | 'stripe';
  orderId: string;
  amount: number;
  currency: string;
  keyId?: string; // Client publishable key
  clientSecret?: string; // For Stripe PaymentIntent
  notes?: Record<string, string>;
  error?: string;
}

export interface VerifyPaymentParams {
  bookingId: string;
  gateway: 'razorpay' | 'stripe';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  stripePaymentIntentId?: string;
  idempotencyKey?: string;
}

export interface VerifyResult {
  success: boolean;
  transactionId: string;
  bookingId: string;
  amountPaid: number;
  gateway: 'razorpay' | 'stripe';
  method: string;
  message?: string;
  error?: string;
}

export interface RefundParams {
  bookingId: string;
  transactionId: string;
  amount: number; // Amount in INR to refund
  reason: string;
  gateway: 'razorpay' | 'stripe';
  idempotencyKey?: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amountRefunded: number;
  gateway: 'razorpay' | 'stripe';
  status: 'PROCESSED' | 'PENDING' | 'FAILED';
  error?: string;
}

// In-memory idempotency cache for webhooks and payment verifications
const processedEvents = new Set<string>();

export class PaymentService {
  // Idempotency check helper
  static isProcessed(key: string): boolean {
    return processedEvents.has(key);
  }

  static markProcessed(key: string): void {
    processedEvents.add(key);
  }

  // 1. CREATE PAYMENT ORDER / INTENT
  static async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    const gateway = params.gateway || 'razorpay';

    // A. RAZORPAY GATEWAY (LIVE / PRODUCTION READY)
    if (gateway === 'razorpay') {
      const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;

      if (!keyId || !keySecret) {
        return {
          success: false,
          gateway: 'razorpay',
          orderId: '',
          amount: params.amount,
          currency: params.currency || 'INR',
          error: 'Razorpay credentials (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are not configured in environment variables.',
        };
      }

      try {
        // eslint-disable-next-line
        const Razorpay = require('razorpay');
        const instance = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });

        // Razorpay receipt max length is 40 characters
        const safeBookingSuffix = params.bookingId.replace(/[^a-zA-Z0-9]/g, '').slice(-10);
        const receipt = `rcpt_${safeBookingSuffix}_${Date.now().toString().slice(-8)}`;

        const options = {
          amount: Math.round(params.amount * 100), // Amount in paise
          currency: params.currency || 'INR',
          receipt,
          notes: {
            bookingId: params.bookingId,
            customerName: params.customerName || 'Guest',
            customerEmail: params.customerEmail || '',
          },
        };

        const order = await instance.orders.create(options);
        return {
          success: true,
          gateway: 'razorpay',
          orderId: order.id,
          amount: params.amount,
          currency: params.currency || 'INR',
          keyId: keyId,
        };
      } catch (err: any) {
        console.error('Razorpay Order Creation Error:', err);
        const errMsg = err.error?.description || err.message || 'Razorpay order creation failed.';
        return {
          success: false,
          gateway: 'razorpay',
          orderId: '',
          amount: params.amount,
          currency: params.currency || 'INR',
          error: errMsg,
        };
      }
    }

    // B. STRIPE GATEWAY (OPTIONAL SECONDARY GATEWAY IF CONFIGURED)
    if (gateway === 'stripe') {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        return {
          success: false,
          gateway: 'stripe',
          orderId: '',
          amount: params.amount,
          currency: 'INR',
          error: 'STRIPE_SECRET_KEY is not configured in environment variables.',
        };
      }

      try {
        // eslint-disable-next-line
        const Stripe = require('stripe');
        const stripe = new Stripe(stripeKey);

        const paymentIntent = await stripe.paymentIntents.create(
          {
            amount: Math.round(params.amount * 100), // Smallest currency unit (paise / cents)
            currency: (params.currency || 'INR').toLowerCase(),
            metadata: {
              bookingId: params.bookingId,
              customerEmail: params.customerEmail,
            },
            receipt_email: params.customerEmail,
          },
          params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : undefined
        );

        return {
          success: true,
          gateway: 'stripe',
          orderId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          amount: params.amount,
          currency: params.currency || 'INR',
          keyId: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || '',
        };
      } catch (err: any) {
        console.error('Stripe Payment Intent Error:', err);
        return {
          success: false,
          gateway: 'stripe',
          orderId: '',
          amount: params.amount,
          currency: 'INR',
          error: err.message || 'Stripe payment intent creation failed.',
        };
      }
    }

    return {
      success: false,
      gateway: 'razorpay',
      orderId: '',
      amount: params.amount,
      currency: 'INR',
      error: `Unsupported payment gateway: ${gateway}`,
    };
  }

  // 2. SERVER-SIDE PAYMENT SIGNATURE & STATUS VERIFICATION
  static async verifyPayment(params: VerifyPaymentParams): Promise<VerifyResult> {
    const incomingTxnId = params.razorpayPaymentId || params.stripePaymentIntentId || '';
    const idempotencyKey = params.idempotencyKey || `verify_${params.bookingId}_${incomingTxnId}`;

    if (!incomingTxnId) {
      return {
        success: false,
        transactionId: '',
        bookingId: params.bookingId,
        amountPaid: 0,
        gateway: params.gateway,
        method: 'UNKNOWN',
        error: 'Missing transaction identifier for payment verification.',
      };
    }

    if (this.isProcessed(idempotencyKey)) {
      return {
        success: true,
        transactionId: incomingTxnId,
        bookingId: params.bookingId,
        amountPaid: 0,
        gateway: params.gateway,
        method: 'ALREADY_PROCESSED',
        message: 'Transaction already verified and processed.',
      };
    }

    // A. VERIFY REAL RAZORPAY SIGNATURE USING HMAC-SHA256
    if (params.gateway === 'razorpay') {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return {
          success: false,
          transactionId: '',
          bookingId: params.bookingId,
          amountPaid: 0,
          gateway: 'razorpay',
          method: 'RAZORPAY',
          error: 'Missing required Razorpay parameters (razorpay_order_id, razorpay_payment_id, razorpay_signature).',
        };
      }

      const secret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;
      if (!secret) {
        return {
          success: false,
          transactionId: razorpayPaymentId,
          bookingId: params.bookingId,
          amountPaid: 0,
          gateway: 'razorpay',
          method: 'RAZORPAY',
          error: 'Server configuration error: RAZORPAY_KEY_SECRET is not configured on the server.',
        };
      }

      const body = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        console.error('[RAZORPAY VERIFY ERROR] Signature mismatch between expected and received.');
        return {
          success: false,
          transactionId: razorpayPaymentId,
          bookingId: params.bookingId,
          amountPaid: 0,
          gateway: 'razorpay',
          method: 'RAZORPAY',
          error: 'Invalid Razorpay payment signature. Payment verification failed.',
        };
      }

      this.markProcessed(idempotencyKey);

      let verifiedMethod = 'RAZORPAY';
      try {
        const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (keyId && secret) {
          // eslint-disable-next-line
          const Razorpay = require('razorpay');
          const instance = new Razorpay({
            key_id: keyId,
            key_secret: secret,
          });
          const payment = await instance.payments.fetch(razorpayPaymentId);
          if (payment && payment.method) {
            if (payment.method === 'upi') {
              verifiedMethod = payment.vpa ? `UPI (${payment.vpa})` : 'UPI_QR';
            } else {
              verifiedMethod = `RAZORPAY_${payment.method.toUpperCase()}`;
            }
          }
        }
      } catch {
        // Fall back gracefully to general RAZORPAY method
      }

      return {
        success: true,
        transactionId: razorpayPaymentId,
        bookingId: params.bookingId,
        amountPaid: 0, // Resolved from verified booking record by calling route
        gateway: 'razorpay',
        method: verifiedMethod,
        message: 'Razorpay payment signature verified successfully.',
      };
    }

    // B. VERIFY STRIPE PAYMENT INTENT STATUS
    if (params.gateway === 'stripe') {
      const { stripePaymentIntentId } = params;

      if (!stripePaymentIntentId) {
        return {
          success: false,
          transactionId: '',
          bookingId: params.bookingId,
          amountPaid: 0,
          gateway: 'stripe',
          method: 'STRIPE',
          error: 'Missing Stripe PaymentIntent ID.',
        };
      }

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        return {
          success: false,
          transactionId: stripePaymentIntentId,
          bookingId: params.bookingId,
          amountPaid: 0,
          gateway: 'stripe',
          method: 'STRIPE',
          error: 'STRIPE_SECRET_KEY is not configured on the server.',
        };
      }

      try {
        // eslint-disable-next-line
        const Stripe = require('stripe');
        const stripe = new Stripe(stripeKey);
        const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
          return {
            success: false,
            transactionId: stripePaymentIntentId,
            bookingId: params.bookingId,
            amountPaid: 0,
            gateway: 'stripe',
            method: 'STRIPE',
            error: `Stripe payment status is ${paymentIntent.status}, expected succeeded.`,
          };
        }
      } catch (err: any) {
        return {
          success: false,
          transactionId: stripePaymentIntentId,
          bookingId: params.bookingId,
          amountPaid: 0,
          gateway: 'stripe',
          method: 'STRIPE',
          error: err.message || 'Failed to verify Stripe PaymentIntent status.',
        };
      }

      this.markProcessed(idempotencyKey);
      return {
        success: true,
        transactionId: stripePaymentIntentId,
        bookingId: params.bookingId,
        amountPaid: 0,
        gateway: 'stripe',
        method: 'STRIPE_CARD',
        message: 'Stripe PaymentIntent verified successfully.',
      };
    }

    return {
      success: false,
      transactionId: '',
      bookingId: params.bookingId,
      amountPaid: 0,
      gateway: 'razorpay',
      method: 'UNKNOWN',
      error: 'Invalid or unsupported payment gateway.',
    };
  }

  // 3. SERVER-SIDE REFUND PROCESSOR
  static async processRefund(params: RefundParams): Promise<RefundResult> {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;
    const idempotencyKey = params.idempotencyKey || `refund_${params.bookingId}_${params.transactionId}`;

    if (this.isProcessed(idempotencyKey)) {
      return {
        success: true,
        refundId: `RFD-IDEMPOTENT-${Date.now()}`,
        amountRefunded: params.amount,
        gateway: params.gateway,
        status: 'PROCESSED',
      };
    }

    // A. RAZORPAY REFUND
    if (params.gateway === 'razorpay' && keyId && keySecret) {
      try {
        // eslint-disable-next-line
        const Razorpay = require('razorpay');
        const instance = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });

        const refund = await instance.payments.refund(params.transactionId, {
          amount: Math.round(params.amount * 100),
          notes: { reason: params.reason, bookingId: params.bookingId },
        });

        this.markProcessed(idempotencyKey);
        return {
          success: true,
          refundId: refund.id,
          amountRefunded: params.amount,
          gateway: 'razorpay',
          status: 'PROCESSED',
        };
      } catch (err: any) {
        console.error('Razorpay Refund Error:', err);
        return {
          success: false,
          refundId: '',
          amountRefunded: 0,
          gateway: 'razorpay',
          status: 'FAILED',
          error: err.message || 'Razorpay refund failed.',
        };
      }
    }

    // B. STRIPE REFUND
    if (params.gateway === 'stripe' && process.env.STRIPE_SECRET_KEY) {
      try {
        // eslint-disable-next-line
        const Stripe = require('stripe');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        const refund = await stripe.refunds.create({
          payment_intent: params.transactionId,
          amount: Math.round(params.amount * 100),
          reason: 'requested_by_customer',
          metadata: { bookingId: params.bookingId, reason: params.reason },
        });

        this.markProcessed(idempotencyKey);
        return {
          success: true,
          refundId: refund.id,
          amountRefunded: params.amount,
          gateway: 'stripe',
          status: 'PROCESSED',
        };
      } catch (err: any) {
        console.error('Stripe Refund Error:', err);
        return {
          success: false,
          refundId: '',
          amountRefunded: 0,
          gateway: 'stripe',
          status: 'FAILED',
          error: err.message || 'Stripe refund failed.',
        };
      }
    }

    return {
      success: false,
      refundId: '',
      amountRefunded: 0,
      gateway: params.gateway,
      status: 'FAILED',
      error: 'Unable to process refund: payment credentials not configured.',
    };
  }

  // 4. WEBHOOK SIGNATURE VERIFICATION
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
    gateway: 'razorpay' | 'stripe'
  ): boolean {
    if (!signature || !secret) return false;

    if (gateway === 'razorpay') {
      const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      return expected === signature;
    }

    if (gateway === 'stripe') {
      try {
        // eslint-disable-next-line
        const Stripe = require('stripe');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
        stripe.webhooks.constructEvent(payload, signature, secret);
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }
}
