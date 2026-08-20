import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token is missing.' }, { status: 400 });
    }

    const verification = await dataStore.verifyPasswordResetToken(token);
    if (!verification.valid || !verification.record) {
      return NextResponse.json(
        { valid: false, error: verification.error || 'Invalid or expired token.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: verification.record.email,
      fullName: verification.record.fullName,
    });
  } catch (error: any) {
    return NextResponse.json({ valid: false, error: 'Failed to verify token.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resetToken, token, newPassword } = body;
    const tokenToUse = resetToken || token;

    if (!tokenToUse || !newPassword) {
      return NextResponse.json(
        { error: 'Reset token and new password are required.' },
        { status: 400 }
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(newPassword);
    const result = await dataStore.consumePasswordResetToken(tokenToUse, passwordHash);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to reset password. The link may have expired or already been used.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now sign in with your new password.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Reset failed.' }, { status: 500 });
  }
}
