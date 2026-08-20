import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/src/lib/dataStore';
import { EmailService } from '@/src/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // 1. Spam Protection & Rate Limiting Check
    if (!dataStore.checkContactRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Too many messages sent. Please wait 10 minutes before submitting another inquiry.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { name, email, phone, subject, message } = body;

    // 2. Server-side Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Please provide a valid full name.' }, { status: 400 });
    }

    if (!email || !email.includes('@') || !email.includes('.')) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json({ error: 'Please enter a message of at least 10 characters.' }, { status: 400 });
    }

    // 3. Record Contact Message in DataStore
    const contactRecord = dataStore.addContactMessage({
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : '',
      subject: subject ? subject.trim() : 'General Concierge Inquiry',
      message: message.trim(),
      ip: clientIp,
    });

    // 4. Notify Estate Concierge
    try {
      await EmailService.sendAdminNotification({
        customerName: name,
        customerEmail: email,
        checkIn: 'Inquiry Date: ' + new Date().toLocaleDateString(),
        checkOut: 'Subject: ' + (subject || 'General Inquiry'),
        totalAmount: 0,
        referenceCode: `INQ-${contactRecord.id.slice(-6)}`,
      });
    } catch (e) {
      console.error('Non-blocking error dispatching concierge email:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for reaching out to Suroor Villa. Our concierge team will contact you shortly.',
      inquiryId: contactRecord.id,
    });
  } catch (err: any) {
    console.error('Contact API Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit contact message.' }, { status: 500 });
  }
}
