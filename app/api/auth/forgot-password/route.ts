import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { EmailService } from '@/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const tokenResult = await dataStore.createPasswordResetToken(cleanEmail);

    if (!tokenResult) {
      // Return neutral message so we don't leak user existence to untrusted scanners
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been sent.',
      });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (req.headers.get('origin') ?? 'http://localhost:3000');
    const resetUrl = `${appUrl}/reset-password?token=${tokenResult.token}`;

    // Send email via EmailService
    await EmailService.sendPasswordResetEmail({
      email: tokenResult.user.email,
      fullName: tokenResult.user.fullName,
      resetToken: tokenResult.token,
      resetUrl,
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset link has been dispatched to your email address.',
      resetToken: tokenResult.token, // Returned for dev/testing ease
      resetUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process password reset.' },
      { status: 500 }
    );
  }
}
