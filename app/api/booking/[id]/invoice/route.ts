import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/src/lib/dataStore';
import { InvoiceGenerator } from '@/src/lib/invoiceGenerator';
import { siteConfig } from '@/src/config/siteConfig';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const bookingId = resolvedParams?.id;
    if (!bookingId) {
      return new NextResponse('Missing booking ID', { status: 400 });
    }

    const booking = dataStore.getBookingById(bookingId);
    if (!booking) {
      return new NextResponse('Booking not found', { status: 404 });
    }

    const villa = booking.villa || (await dataStore.getVilla('villa-suroor-main')) || { name: 'Suroor Villa' };
    const invoiceNum = booking.invoices?.[0]?.invoiceNumber || `INV-2026-${(booking.id || '0000').slice(-4)}`;

    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    const nights = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));

    const baseAmount = booking.baseAmount || 45000 * nights;
    const cleaningFee = booking.cleaningFee || 3500;
    const serviceFee = booking.serviceFee || 2250;
    const discountAmount = booking.discountAmount || 0;

    const taxableAmount = baseAmount + cleaningFee + serviceFee - discountAmount;
    const cgstAmount = Math.round(taxableAmount * 0.09); // 9% CGST
    const sgstAmount = Math.round(taxableAmount * 0.09); // 9% SGST
    const totalAmount = taxableAmount + cgstAmount + sgstAmount;

    const primaryGuest = booking.guests?.find((g: any) => g.isPrimary) || booking.guests?.[0] || {};

    const invoiceHtml = InvoiceGenerator.generateHTMLInvoice({
      invoiceNumber: invoiceNum,
      invoiceDate: new Date(booking.createdAt || Date.now()).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      bookingId: booking.id,
      referenceCode: booking.referenceCode,
      customerName: primaryGuest.fullName || booking.customerName || 'Guest',
      customerEmail: primaryGuest.email || booking.customerEmail || 'guest@example.com',
      customerPhone: primaryGuest.phone || booking.customerPhone || '',
      govermentId: primaryGuest.idNumber || 'Verified ID',
      villaName: villa.name || 'Suroor Villa',
      roomName: booking.roomId ? 'Selected Luxury Suite' : 'Whole Private Villa Sanctuary',
      checkIn: checkInDate.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
      checkOut: checkOutDate.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
      numberOfNights: nights,
      guestCount: booking.guestCount || 2,
      baseAmount,
      cleaningFee,
      serviceFee,
      discountAmount,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      totalAmount,
      paymentStatus: (booking.status as 'PAID' | 'REFUNDED' | 'PENDING' | 'CANCELLED') || 'PAID',
      paymentMethod: booking.paymentGateway || 'ONLINE_GATEWAY',
      transactionId: booking.paymentTransactionId || `TXN-${booking.referenceCode}`,
      gstin: siteConfig.billing.gstNumber,
    });

    return new NextResponse(invoiceHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('Invoice Route Error:', err);
    return new NextResponse('Error generating invoice', { status: 500 });
  }
}
