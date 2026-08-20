import { siteConfig, isDemoGstin } from '@/config/siteConfig';

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  bookingId: string;
  referenceCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  govermentId?: string;
  villaName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  numberOfNights: number;
  guestCount: number;
  baseAmount: number;
  cleaningFee: number;
  serviceFee: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number; // 9%
  sgstAmount: number; // 9%
  totalAmount: number;
  paymentStatus: 'PAID' | 'REFUNDED' | 'PENDING' | 'CANCELLED';
  paymentMethod: string;
  transactionId: string;
  gstin?: string;
}

export class InvoiceGenerator {
  static generateHTMLInvoice(data: InvoiceData): string {
    const rawGstin = data.gstin || siteConfig.billing.gstNumber || '01AAAAA0000A1Z5';
    const isDemo = siteConfig.billing.isDemo || isDemoGstin(rawGstin);
    const totalGst = data.cgstAmount + data.sgstAmount;
    const businessName = siteConfig.billing.businessName;
    const businessAddress = siteConfig.billing.businessAddress;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Invoice #${data.invoiceNumber} - ${businessName}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #2D3748;
            margin: 0;
            padding: 40px;
            background-color: #FAFAFA;
          }
          .invoice-box {
            max-width: 800px;
            margin: auto;
            padding: 40px;
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
            border-radius: 8px;
          }
          .demo-banner {
            background-color: #FEF3C7;
            border: 1px solid #F59E0B;
            color: #92400E;
            padding: 10px 14px;
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 12px;
            text-align: center;
            font-weight: bold;
            letter-spacing: 0.5px;
          }
          .header-table {
            width: 100%;
            margin-bottom: 30px;
            border-bottom: 2px solid #1A2E22;
            padding-bottom: 20px;
          }
          .brand-title {
            font-size: 26px;
            font-family: Georgia, serif;
            letter-spacing: 2px;
            color: #1A2E22;
            margin: 0;
          }
          .brand-sub {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: #C5A880;
            margin-top: 4px;
          }
          .invoice-title {
            font-size: 22px;
            font-weight: bold;
            color: #1A2E22;
            text-align: right;
            margin: 0;
          }
          .details-table {
            width: 100%;
            margin-bottom: 30px;
          }
          .details-table td {
            vertical-align: top;
            width: 50%;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .status-PAID { background: #DEF7EC; color: #03543F; }
          .status-REFUNDED { background: #FEECDC; color: #9B1C1C; }
          .status-PENDING { background: #FEF08A; color: #713F12; }
          .status-CANCELLED { background: #FDE8E8; color: #9B1C1C; }

          .line-items {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .line-items th {
            background-color: #1A2E22;
            color: #F8F5F0;
            text-align: left;
            padding: 12px 16px;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .line-items td {
            padding: 14px 16px;
            border-bottom: 1px solid #E2E8F0;
            font-size: 14px;
          }
          .totals-table {
            width: 350px;
            margin-left: auto;
            border-collapse: collapse;
          }
          .totals-table td {
            padding: 8px 12px;
            font-size: 14px;
          }
          .totals-table tr.grand-total {
            border-top: 2px solid #1A2E22;
            font-weight: bold;
            font-size: 16px;
            color: #1A2E22;
          }
          .footer-notes {
            margin-top: 36px;
            padding-top: 20px;
            border-top: 1px solid #E2E8F0;
            font-size: 12px;
            color: #718096;
            text-align: center;
            line-height: 1.6;
          }
          @media print {
            body { padding: 0; background: none; }
            .invoice-box { border: none; box-shadow: none; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>

        <div style="max-width: 800px; margin: 0 auto 16px auto;" class="no-print">
          <button onclick="window.print()" style="background: #1A2E22; color: #FFF; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 13px;">🖨️ Print / Download PDF Invoice</button>
        </div>

        <div class="invoice-box">
          ${
            isDemo
              ? `<div class="demo-banner">
                  ⚠️ DEMO INVOICE / TEST SANDBOX MODE — NOT VALID FOR REAL TAX OR OFFICIAL COMMERCIAL FILING
                </div>`
              : ''
          }

          <table class="header-table">
            <tr>
              <td>
                <h1 class="brand-title">${businessName.toUpperCase()}</h1>
                <div class="brand-sub">Suroor Luxury Estate Kashmir</div>
                <div style="font-size: 12px; color: #718096; margin-top: 8px; line-height: 1.5;">
                  ${businessAddress}<br>
                  ${
                    isDemo
                      ? `Tax Identifiers: <span style="background: #FEF3C7; color: #92400E; padding: 1px 6px; border-radius: 3px; font-weight: bold;">DEMO GST: ${rawGstin} (Sandbox Mode)</span>`
                      : `GSTIN: <strong>${rawGstin}</strong>`
                  }
                  <br>
                  Concierge Desk: <strong>${siteConfig.ownerPhone}</strong> | WhatsApp: <strong>${siteConfig.whatsappNumber}</strong>
                </div>
              </td>
              <td style="text-align: right;">
                <h2 class="invoice-title">${isDemo ? 'DEMO TAX INVOICE' : 'TAX INVOICE'}</h2>
                <div style="font-size: 13px; color: #4A5568; margin-top: 6px;">
                  Invoice #: <strong>${data.invoiceNumber}</strong><br>
                  Date: ${data.invoiceDate}<br>
                  Booking Ref: <strong>${data.referenceCode}</strong>
                </div>
                <div style="margin-top: 12px;">
                  <span class="status-badge status-${data.paymentStatus}">${data.paymentStatus}</span>
                </div>
              </td>
            </tr>
          </table>

          <table class="details-table">
            <tr>
              <td>
                <strong style="color: #1A2E22; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Billed To (Guest):</strong><br>
                <span style="font-size: 16px; font-weight: bold; color: #1A2E22;">${data.customerName}</span><br>
                Email: ${data.customerEmail}<br>
                ${data.customerPhone ? `Phone: ${data.customerPhone}<br>` : ''}
                ${data.govermentId ? `ID Proof: ${data.govermentId}<br>` : ''}
              </td>
              <td>
                <strong style="color: #1A2E22; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Stay Particulars:</strong><br>
                Property: <strong>${data.villaName}</strong> (${data.roomName})<br>
                Check-In: <strong>${data.checkIn}</strong> (2:00 PM)<br>
                Check-Out: <strong>${data.checkOut}</strong> (11:00 AM)<br>
                Duration: <strong>${data.numberOfNights} Night(s)</strong> | Guests: <strong>${data.guestCount}</strong>
              </td>
            </tr>
          </table>

          <table class="line-items">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Rate / Night</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Accommodation Charges</strong><br>
                  <span style="font-size: 12px; color: #718096;">${data.villaName} - ${data.roomName} (${data.checkIn} to ${data.checkOut})</span>
                </td>
                <td style="text-align: center;">₹${Math.round(data.baseAmount / data.numberOfNights).toLocaleString('en-IN')}</td>
                <td style="text-align: center;">${data.numberOfNights} Nights</td>
                <td style="text-align: right;">₹${data.baseAmount.toLocaleString('en-IN')}</td>
              </tr>
              ${
                data.cleaningFee > 0
                  ? `
                <tr>
                  <td>Sanitization & Estate Maintenance Fee</td>
                  <td style="text-align: center;">-</td>
                  <td style="text-align: center;">1</td>
                  <td style="text-align: right;">₹${data.cleaningFee.toLocaleString('en-IN')}</td>
                </tr>
              `
                  : ''
              }
              ${
                data.serviceFee > 0
                  ? `
                <tr>
                  <td>Butler & Dedicated Estate Concierge Service Charge</td>
                  <td style="text-align: center;">-</td>
                  <td style="text-align: center;">1</td>
                  <td style="text-align: right;">₹${data.serviceFee.toLocaleString('en-IN')}</td>
                </tr>
              `
                  : ''
              }
              ${
                data.discountAmount > 0
                  ? `
                <tr style="color: #047857;">
                  <td>Promotional Discount / Coupon Applied</td>
                  <td style="text-align: center;">-</td>
                  <td style="text-align: center;">1</td>
                  <td style="text-align: right;">-₹${data.discountAmount.toLocaleString('en-IN')}</td>
                </tr>
              `
                  : ''
              }
            </tbody>
          </table>

          <table class="totals-table">
            <tr>
              <td>Taxable Subtotal:</td>
              <td style="text-align: right;">₹${data.taxableAmount.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>CGST (9%):</td>
              <td style="text-align: right;">₹${data.cgstAmount.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>SGST (9%):</td>
              <td style="text-align: right;">₹${data.sgstAmount.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>Total GST (18%):</td>
              <td style="text-align: right;">₹${totalGst.toLocaleString('en-IN')}</td>
            </tr>
            <tr class="grand-total">
              <td style="padding-top: 12px;">Grand Total:</td>
              <td style="text-align: right; padding-top: 12px;">₹${data.totalAmount.toLocaleString('en-IN')}</td>
            </tr>
          </table>

          <div style="background: #F7F5F0; padding: 16px; border-radius: 6px; margin-top: 30px; font-size: 13px; color: #4A5568;">
            <p style="margin: 0 0 4px 0;"><strong>Payment Record:</strong></p>
            <p style="margin: 0;">Method: <strong>${data.paymentMethod}</strong> | Transaction ID: <strong>${data.transactionId}</strong> | Payment Status: <strong>${data.paymentStatus}</strong></p>
          </div>

          <div class="footer-notes">
            Thank you for choosing ${siteConfig.name} Kashmir.<br>
            ${
              isDemo
                ? '<strong>Demo Notice:</strong> This document is generated for demonstration and testing purposes. GSTIN is a non-commercial sandbox test value.'
                : 'This is a computer-generated tax invoice compliant with Indian GST rules.'
            }<br>
            For any queries, please contact ${siteConfig.ownerEmail} or call / WhatsApp ${siteConfig.ownerPhone}.
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

