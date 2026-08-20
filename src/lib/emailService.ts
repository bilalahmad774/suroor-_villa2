import { siteConfig } from '@/config/siteConfig';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: string; contentType?: string }>;
}

export interface EmailData {
  customerName: string;
  customerEmail: string;
  bookingId?: string;
  referenceCode?: string;
  villaName?: string;
  checkIn?: string;
  checkOut?: string;
  guestCount?: number;
  totalAmount?: number;
  paidAmount?: number;
  refundAmount?: number;
  paymentMethod?: string;
  transactionId?: string;
  verificationToken?: string;
  modificationDetails?: string;
  reason?: string;
  invoiceUrl?: string;
}

const BRAND_HEADER = `
  <div style="background-color: #1A2E22; padding: 28px 20px; text-align: center; border-bottom: 2px solid #C5A880; font-family: 'Times New Roman', serif;">
    <h1 style="color: #F8F5F0; margin: 0; font-size: 26px; letter-spacing: 2px; font-weight: 300;">SUROOR VILLA</h1>
    <p style="color: #C5A880; margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 3px;">Kashmir • Luxury Estate</p>
  </div>
`;

const BRAND_FOOTER = `
  <div style="background-color: #1A2E22; padding: 24px 20px; text-align: center; color: #A3B19B; font-size: 12px; font-family: sans-serif; border-top: 1px solid #2D4436;">
    <p style="margin: 0 0 8px 0; color: #E2E8F0;">${siteConfig.ownerName} • ${siteConfig.address}</p>
    <p style="margin: 0 0 8px 0;">Phone: ${siteConfig.ownerPhone} | WhatsApp: ${siteConfig.whatsappNumber} | Email: ${siteConfig.ownerEmail}</p>
    <p style="margin: 0; color: #C5A880; font-size: 11px;">© 2026 Suroor Villa Kashmir. All rights reserved.</p>
  </div>
`;

export class EmailService {
  private static async sendRawEmail(payload: EmailPayload): Promise<{ success: boolean; id?: string; error?: string }> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL || 'Suroor Villa <reservations@suroorvilla.in>';

    if (apiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            attachments: payload.attachments,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('Resend Email Error:', data);
          return { success: false, error: data?.message || 'Failed to send email' };
        }

        return { success: true, id: data?.id };
      } catch (err: any) {
        console.error('Failed to dispatch email via Resend:', err);
        return { success: false, error: err.message };
      }
    }

    // Fallback log when RESEND_API_KEY is not set
    console.log(`[EMAIL DISPATCH SIMULATION] To: ${payload.to} | Subject: ${payload.subject}`);
    return { success: true, id: `mock_email_${Date.now()}` };
  }

  // 1. WELCOME EMAIL
  static async sendWelcomeEmail(data: EmailData) {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; background: #FDFBF7; border: 1px solid #E2D9CC; border-radius: 8px; overflow: hidden;">
        ${BRAND_HEADER}
        <div style="padding: 32px 24px; font-family: sans-serif; color: #2D3748; line-height: 1.6;">
          <h2 style="color: #1A2E22; font-size: 22px; margin-top: 0;">Welcome to Suroor Villa, ${data.customerName}!</h2>
          <p>We are delighted to welcome you to Kashmir's premier sanctuary of serenity and luxury. Your guest account has been successfully created.</p>
          <p>You can now browse private suites, lock in seasonal dates, manage your reservations, and download invoices directly from your personal dashboard.</p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard" style="background-color: #1A2E22; color: #F8F5F0; padding: 12px 28px; text-decoration: none; border-radius: 4px; font-weight: 600; display: inline-block;">Access Guest Dashboard</a>
          </div>
          <p>Warmest regards,<br><strong>The Suroor Concierge Team</strong></p>
        </div>
        ${BRAND_FOOTER}
      </div>
    `;

    return this.sendRawEmail({
      to: data.customerEmail,
      subject: 'Welcome to Suroor Villa Kashmir',
      html,
    });
  }

  // 2. EMAIL VERIFICATION
  static async sendVerificationEmail(data: EmailData) {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; background: #FDFBF7; border: 1px solid #E2D9CC; border-radius: 8px; overflow: hidden;">
        ${BRAND_HEADER}
        <div style="padding: 32px 24px; font-family: sans-serif; color: #2D3748; line-height: 1.6;">
          <h2 style="color: #1A2E22; font-size: 20px; margin-top: 0;">Verify Your Email Address</h2>
          <p>Dear ${data.customerName},</p>
          <p>Please confirm your email address to complete your registration with Suroor Villa.</p>
          <div style="background: #F1ECE3; border-left: 4px solid #C5A880; padding: 16px; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; color: #1A2E22;">
            ${data.verificationToken || '849203'}
          </div>
          <p style="font-size: 13px; color: #718096;">If you did not request this, please ignore this email.</p>
        </div>
        ${BRAND_FOOTER}
      </div>
    `;

    return this.sendRawEmail({
      to: data.customerEmail,
      subject: 'Verify Your Email - Suroor Villa',
      html,
    });
  }

  // 3. BOOKING CONFIRMATION
  static async sendBookingConfirmation(data: EmailData) {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; background: #FDFBF7; border: 1px solid #E2D9CC; border-radius: 8px; overflow: hidden;">
        ${BRAND_HEADER}
        <div style="padding: 32px 24px; font-family: sans-serif; color: #2D3748; line-height: 1.6;">
          <div style="background-color: #E6F4EA; border-left: 4px solid #34A853; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
            <p style="margin: 0; color: #137333; font-weight: 600;">Reservation Confirmed • Ref: ${data.referenceCode}</p>
          </div>
          <h2 style="color: #1A2E22; font-size: 22px; margin-top: 0;">We Look Forward to Hosting You, ${data.customerName}</h2>
          <p>Your stay at <strong>Suroor Villa</strong> is guaranteed. Below are your reservation details:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
            <tr style="border-bottom: 1px solid #E2E8F0;">
              <td style="padding: 10px 0; color: #718096;">Check-In Date:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #1A2E22;">${data.checkIn} (from 2:00 PM)</td>
            </tr>
            <tr style="border-bottom: 1px solid #E2E8F0;">
              <td style="padding: 10px 0; color: #718096;">Check-Out Date:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #1A2E22;">${data.checkOut} (until 11:00 AM)</td>
            </tr>
            <tr style="border-bottom: 1px solid #E2E8F0;">
              <td style="padding: 10px 0; color: #718096;">Guests:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #1A2E22;">${data.guestCount} Guest(s)</td>
            </tr>
            <tr style="border-bottom: 1px solid #E2E8F0;">
              <td style="padding: 10px 0; color: #718096;">Total Reserved Amount:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #1A2E22; font-size: 16px;">₹${data.totalAmount?.toLocaleString('en-IN')}</td>
            </tr>
          </table>

          <div style="margin: 28px 0; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/my-bookings" style="background-color: #1A2E22; color: #F8F5F0; padding: 12px 28px; text-decoration: none; border-radius: 4px; font-weight: 600; display: inline-block;">Manage Booking & Invoice</a>
          </div>
        </div>
        ${BRAND_FOOTER}
      </div>
    `;

    return this.sendRawEmail({
      to: data.customerEmail,
      subject: `Booking Confirmed [${data.referenceCode}] - Suroor Villa Kashmir`,
      html,
    });
  }

  // 4. PAYMENT CONFIRMATION
  static async sendPaymentConfirmation(data: EmailData) {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; background: #FDFBF7; border: 1px solid #E2D9CC; border-radius: 8px; overflow: hidden;">
        ${BRAND_HEADER}
        <div style="padding: 32px 24px; font-family: sans-serif; color: #2D3748; line-height: 1.6;">
          <h2 style="color: #1A2E22; font-size: 20px; margin-top: 0;">Payment Received & Verified</h2>
          <p>Dear ${data.customerName},</p>
          <p>We have successfully received your payment of <strong>₹${data.paidAmount?.toLocaleString('en-IN')}</strong> for booking reference <strong>${data.referenceCode}</strong>.</p>
          
          <div style="background: #F7F5F0; border: 1px dashed #C5A880; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 13px;">
            <p style="margin: 4px 0;"><strong>Transaction ID:</strong> ${data.transactionId}</p>
            <p style="margin: 4px 0;"><strong>Payment Method:</strong> ${data.paymentMethod}</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> PAID & VERIFIED</p>
          </div>
        </div>
        ${BRAND_FOOTER}
      </div>
    `;

    return this.sendRawEmail({
      to: data.customerEmail,
      subject: `Payment Receipt [${data.referenceCode}] - Suroor Villa`,
      html,
    });
  }

  // 5. BOOKING MODIFICATION
  static async sendBookingModification(data: EmailData) {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; background: #FDFBF7; border: 1px solid #E2D9CC; border-radius: 8px; overflow: hidden;">
        ${BRAND_HEADER}
        <div style="padding: 32px 24px; font-family: sans-serif; color: #2D3748; line-height: 1.6;">
          <h2 style="color: #1A2E22; font-size: 20px; margin-top: 0;">Reservation Modification Notice</h2>
          <p>Dear ${data.customerName},</p>
          <p>Your booking <strong>${data.referenceCode}</strong> has been modified.</p>
          <p><strong>Modification Summary:</strong><br>${data.modificationDetails || 'Dates and guest preferences updated.'}</p>
        </div>
        ${BRAND_FOOTER}
      </div>
    `;

    return this.sendRawEmail({
      to: data.customerEmail,
      subject: `Booking Modified [${data.referenceCode}] - Suroor Villa`,
      html,
    });
  }

  // 6. CANCELLATION EMAIL
  static async sendCancellationEmail(data: EmailData) {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; background: #FDFBF7; border: 1px solid #E2D9CC; border-radius: 8px; overflow: hidden;">
        ${BRAND_HEADER}
        <div style="padding: 32px 24px; font-family: sans-serif; color: #2D3748; line-height: 1.6;">
          <div style="background-color: #FCE8E6; border-left: 4px solid #EA4335; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
            <p style="margin: 0; color: #C5221F; font-weight: 600;">Booking Cancelled • Ref: ${data.referenceCode}</p>
          </div>
          <h2 style="color: #1A2E22; font-size: 20px; margin-top: 0;">Cancellation Notice</h2>
          <p>Dear ${data.customerName},</p>
          <p>Your reservation <strong>${data.referenceCode}</strong> at Suroor Villa has been cancelled as per your request.</p>
          <p><strong>Reason / Policy Note:</strong> ${data.reason || 'Requested by guest'}</p>
          ${
            data.refundAmount && data.refundAmount > 0
              ? `<p>A refund of <strong>₹${data.refundAmount.toLocaleString('en-IN')}</strong> has been approved server-side and dispatched to your original payment method.</p>`
              : '<p>As per the cancellation policy timeline, no refund was applicable for this cancellation window.</p>'
          }
        </div>
        ${BRAND_FOOTER}
      </div>
    `;

    return this.sendRawEmail({
      to: data.customerEmail,
      subject: `Booking Cancelled [${data.referenceCode}] - Suroor Villa`,
      html,
    });
  }

  // 7. REFUND EMAIL
  static async sendRefundEmail(data: EmailData) {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; background: #FDFBF7; border: 1px solid #E2D9CC; border-radius: 8px; overflow: hidden;">
        ${BRAND_HEADER}
        <div style="padding: 32px 24px; font-family: sans-serif; color: #2D3748; line-height: 1.6;">
          <h2 style="color: #1A2E22; font-size: 20px; margin-top: 0;">Refund Dispatched</h2>
          <p>Dear ${data.customerName},</p>
          <p>We have processed a refund of <strong>₹${data.refundAmount?.toLocaleString('en-IN')}</strong> for booking reference <strong>${data.referenceCode}</strong>.</p>
          <p>Please allow 3-5 business days for the credit to reflect on your statement.</p>
        </div>
        ${BRAND_FOOTER}
      </div>
    `;

    return this.sendRawEmail({
      to: data.customerEmail,
      subject: `Refund Notice [${data.referenceCode}] - Suroor Villa`,
      html,
    });
  }

  // 8. INVOICE EMAIL
  static async sendInvoiceEmail(data: EmailData) {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; background: #FDFBF7; border: 1px solid #E2D9CC; border-radius: 8px; overflow: hidden;">
        ${BRAND_HEADER}
        <div style="padding: 32px 24px; font-family: sans-serif; color: #2D3748; line-height: 1.6;">
          <h2 style="color: #1A2E22; font-size: 20px; margin-top: 0;">Official Tax Invoice</h2>
          <p>Dear ${data.customerName},</p>
          <p>Please find link to your official tax invoice for booking reference <strong>${data.referenceCode}</strong>.</p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/api/booking/${data.bookingId}/invoice" style="background-color: #1A2E22; color: #F8F5F0; padding: 12px 28px; text-decoration: none; border-radius: 4px; font-weight: 600; display: inline-block;">Download PDF / View Invoice</a>
          </div>
        </div>
        ${BRAND_FOOTER}
      </div>
    `;

    return this.sendRawEmail({
      to: data.customerEmail,
      subject: `Tax Invoice [${data.referenceCode}] - Suroor Villa`,
      html,
    });
  }

  // 9. CHECK-IN REMINDER EMAIL
  static async sendCheckInReminder(data: EmailData) {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; background: #FDFBF7; border: 1px solid #E2D9CC; border-radius: 8px; overflow: hidden;">
        ${BRAND_HEADER}
        <div style="padding: 32px 24px; font-family: sans-serif; color: #2D3748; line-height: 1.6;">
          <h2 style="color: #1A2E22; font-size: 20px; margin-top: 0;">Upcoming Arrival Reminder</h2>
          <p>Dear ${data.customerName},</p>
          <p>Your stay at Suroor Villa begins soon on <strong>${data.checkIn}</strong>.</p>
          <p><strong>Check-In Time:</strong> 2:00 PM onwards<br><strong>Butler Direct Contact:</strong> +91 98765 43210</p>
          <p>Please ensure you bring a valid government ID (Aadhaar or Passport) for all adult guests.</p>
        </div>
        ${BRAND_FOOTER}
      </div>
    `;

    return this.sendRawEmail({
      to: data.customerEmail,
      subject: `Upcoming Stay Reminder [${data.referenceCode}] - Suroor Villa`,
      html,
    });
  }

  // 10. ADMIN NEW BOOKING NOTIFICATION
  static async sendAdminNotification(data: EmailData) {
    const adminEmail = process.env.ESTATE_SUPPORT_EMAIL || 'concierge@suroorvilla.in';
    const html = `
      <div style="max-width: 600px; margin: 0 auto; background: #FDFBF7; border: 1px solid #E2D9CC; border-radius: 8px; overflow: hidden;">
        ${BRAND_HEADER}
        <div style="padding: 32px 24px; font-family: sans-serif; color: #2D3748; line-height: 1.6;">
          <h2 style="color: #1A2E22; font-size: 20px; margin-top: 0;">🔔 New Confirmed Booking Received</h2>
          <p><strong>Reference:</strong> ${data.referenceCode}</p>
          <p><strong>Guest:</strong> ${data.customerName} (${data.customerEmail})</p>
          <p><strong>Dates:</strong> ${data.checkIn} to ${data.checkOut}</p>
          <p><strong>Guests:</strong> ${data.guestCount}</p>
          <p><strong>Total Paid:</strong> ₹${data.totalAmount?.toLocaleString('en-IN')}</p>
        </div>
        ${BRAND_FOOTER}
      </div>
    `;

    return this.sendRawEmail({
      to: adminEmail,
      subject: `[ADMIN ALERT] New Booking: ${data.referenceCode} - ₹${data.totalAmount}`,
      html,
    });
  }

  // 11. PASSWORD RESET EMAIL
  static async sendPasswordResetEmail(data: { email: string; fullName: string; resetToken: string; resetUrl: string }) {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; background: #FDFBF7; border: 1px solid #E2D9CC; border-radius: 8px; overflow: hidden;">
        ${BRAND_HEADER}
        <div style="padding: 32px 24px; font-family: sans-serif; color: #2D3748; line-height: 1.6;">
          <h2 style="color: #1A2E22; font-size: 20px; margin-top: 0;">Password Reset Request</h2>
          <p>Dear ${data.fullName || 'Guest'},</p>
          <p>We received a request to reset your password for your Suroor Villa account.</p>
          <p>Click the secure button below to set a new password. This link is valid for <strong>1 hour</strong>.</p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="${data.resetUrl}" style="background-color: #1A2E22; color: #F8F5F0; padding: 12px 28px; text-decoration: none; border-radius: 4px; font-weight: 600; display: inline-block;">Reset My Password</a>
          </div>
          <p style="font-size: 13px; color: #718096;">If the button above does not work, copy and paste this link into your browser:<br><span style="color: #3182CE; word-break: break-all;">${data.resetUrl}</span></p>
          <p style="font-size: 13px; color: #718096; margin-top: 16px;">If you did not request a password reset, please ignore this email or contact our concierge immediately.</p>
        </div>
        ${BRAND_FOOTER}
      </div>
    `;

    return this.sendRawEmail({
      to: data.email,
      subject: 'Reset Your Password - Suroor Villa Kashmir',
      html,
    });
  }
}
