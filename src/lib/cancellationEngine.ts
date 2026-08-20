import { PaymentService } from './paymentService';
import { EmailService } from './emailService';
import { dataStore } from './dataStore';

export interface CancellationPolicy {
  freeCancellationDays: number; // e.g., 7 days prior
  partialRefundDays: number; // e.g., 3 days prior
  partialRefundPercentage: number; // e.g., 50%
}

export interface CalculateRefundResult {
  daysUntilCheckIn: number;
  policyApplied: 'FREE_CANCELLATION' | 'PARTIAL_REFUND' | 'NO_REFUND' | 'CUSTOM_OVERRIDE';
  refundPercentage: number;
  totalPaid: number;
  refundAmount: number;
  cancellationFee: number;
  explanation: string;
}

export interface ProcessCancellationParams {
  bookingId: string;
  userEmail: string;
  isAdmin?: boolean;
  reason?: string;
  customRefundPercentage?: number;
}

export interface ProcessCancellationResult {
  success: boolean;
  bookingId: string;
  status: 'CANCELLED';
  refundAmount: number;
  refundStatus: 'PROCESSED' | 'NONE' | 'FAILED';
  refundId?: string;
  explanation: string;
  error?: string;
}

export const DEFAULT_CANCELLATION_POLICY: CancellationPolicy = {
  freeCancellationDays: 7,
  partialRefundDays: 3,
  partialRefundPercentage: 50,
};

export class CancellationEngine {
  // 1. SERVER-SIDE REFUND CALCULATOR (NEVER TRUST FRONTEND)
  static calculateRefund(
    checkInDateStr: string,
    totalPaid: number,
    policy: CancellationPolicy = DEFAULT_CANCELLATION_POLICY,
    customRefundPercentage?: number
  ): CalculateRefundResult {
    const checkIn = new Date(checkInDateStr);
    const now = new Date();

    // Difference in days
    const diffMs = checkIn.getTime() - now.getTime();
    const daysUntilCheckIn = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Custom Admin Override
    if (typeof customRefundPercentage === 'number') {
      const pct = Math.max(0, Math.min(100, customRefundPercentage));
      const refundAmount = Math.round((totalPaid * pct) / 100);
      return {
        daysUntilCheckIn,
        policyApplied: 'CUSTOM_OVERRIDE',
        refundPercentage: pct,
        totalPaid,
        refundAmount,
        cancellationFee: totalPaid - refundAmount,
        explanation: `Custom administrative refund policy of ${pct}% applied.`,
      };
    }

    // Free Cancellation (> freeCancellationDays)
    if (daysUntilCheckIn >= policy.freeCancellationDays) {
      return {
        daysUntilCheckIn,
        policyApplied: 'FREE_CANCELLATION',
        refundPercentage: 100,
        totalPaid,
        refundAmount: totalPaid,
        cancellationFee: 0,
        explanation: `Full 100% refund available because cancellation is ${daysUntilCheckIn} day(s) before check-in (Policy requirement: ${policy.freeCancellationDays}+ days).`,
      };
    }

    // Partial Refund (between partialRefundDays and freeCancellationDays)
    if (daysUntilCheckIn >= policy.partialRefundDays) {
      const refundAmount = Math.round((totalPaid * policy.partialRefundPercentage) / 100);
      return {
        daysUntilCheckIn,
        policyApplied: 'PARTIAL_REFUND',
        refundPercentage: policy.partialRefundPercentage,
        totalPaid,
        refundAmount,
        cancellationFee: totalPaid - refundAmount,
        explanation: `Partial ${policy.partialRefundPercentage}% refund applied because cancellation is ${daysUntilCheckIn} day(s) before check-in (Policy requirement: ${policy.partialRefundDays}–${policy.freeCancellationDays} days).`,
      };
    }

    // No Refund (< partialRefundDays)
    return {
      daysUntilCheckIn,
      policyApplied: 'NO_REFUND',
      refundPercentage: 0,
      totalPaid,
      refundAmount: 0,
      cancellationFee: totalPaid,
      explanation: `No refund available because cancellation is requested less than ${policy.partialRefundDays} days prior to check-in (${daysUntilCheckIn} days remaining).`,
    };
  }

  // 2. COMPLETE SERVER-SIDE CANCELLATION FLOW
  static async processCancellation(params: ProcessCancellationParams): Promise<ProcessCancellationResult> {
    // A. Verify booking existence
    const booking = dataStore.getBookingById(params.bookingId);
    if (!booking) {
      return {
        success: false,
        bookingId: params.bookingId,
        status: 'CANCELLED',
        refundAmount: 0,
        refundStatus: 'FAILED',
        explanation: '',
        error: 'Booking not found.',
      };
    }

    // B. Verify ownership unless admin
    if (!params.isAdmin && booking.customerEmail.toLowerCase() !== params.userEmail.toLowerCase()) {
      return {
        success: false,
        bookingId: params.bookingId,
        status: 'CANCELLED',
        refundAmount: 0,
        refundStatus: 'FAILED',
        explanation: '',
        error: 'Forbidden: You do not own this reservation.',
      };
    }

    if (booking.status === 'CANCELLED') {
      return {
        success: false,
        bookingId: params.bookingId,
        status: 'CANCELLED',
        refundAmount: booking.refundAmount || 0,
        refundStatus: 'NONE',
        explanation: 'Booking is already cancelled.',
        error: 'Booking is already cancelled.',
      };
    }

    // C. Calculate refund server-side
    const totalPaid = booking.paidAmount || booking.pricingQuote.totalPrice;
    const calcResult = this.calculateRefund(
      booking.checkIn,
      totalPaid,
      DEFAULT_CANCELLATION_POLICY,
      params.customRefundPercentage
    );

    let refundGatewayResult = null;
    let refundStatus: 'PROCESSED' | 'NONE' | 'FAILED' = 'NONE';

    // D. Initiate payment gateway refund if amount > 0 and transaction exists
    if (calcResult.refundAmount > 0 && booking.paymentTransactionId) {
      refundGatewayResult = await PaymentService.processRefund({
        bookingId: booking.id,
        transactionId: booking.paymentTransactionId,
        amount: calcResult.refundAmount,
        reason: params.reason || calcResult.explanation,
        gateway: booking.paymentGateway === 'stripe' ? 'stripe' : 'razorpay',
      });

      refundStatus = refundGatewayResult.success ? 'PROCESSED' : 'FAILED';
    }

    // E. Update booking in dataStore
    booking.status = 'CANCELLED';
    booking.cancellationReason = params.reason || calcResult.explanation;
    booking.refundAmount = calcResult.refundAmount;
    booking.refundStatus = refundStatus;
    booking.updatedAt = new Date().toISOString();

    dataStore.updateBooking(booking.id, {
      status: 'CANCELLED',
      cancellationReason: booking.cancellationReason,
      refundAmount: booking.refundAmount,
      refundStatus,
    });

    // F. Record audit log
    dataStore.addAuditLog({
      action: 'BOOKING_CANCELLED',
      entity: 'BOOKING',
      entityId: booking.id,
      details: `Cancelled booking ${booking.referenceCode} by ${params.userEmail}. Refund amount: ₹${calcResult.refundAmount} (${calcResult.policyApplied})`,
    });

    // G. Send confirmation emails
    try {
      await EmailService.sendCancellationEmail({
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        bookingId: booking.id,
        referenceCode: booking.referenceCode,
        refundAmount: calcResult.refundAmount,
        reason: params.reason || calcResult.explanation,
      });

      if (calcResult.refundAmount > 0) {
        await EmailService.sendRefundEmail({
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          bookingId: booking.id,
          referenceCode: booking.referenceCode,
          refundAmount: calcResult.refundAmount,
        });
      }
    } catch (e) {
      console.error('Email dispatch error on cancellation:', e);
    }

    return {
      success: true,
      bookingId: booking.id,
      status: 'CANCELLED',
      refundAmount: calcResult.refundAmount,
      refundStatus,
      refundId: refundGatewayResult?.refundId,
      explanation: calcResult.explanation,
    };
  }
}
