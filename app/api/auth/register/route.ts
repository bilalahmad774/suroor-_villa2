import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { hashPassword, generateToken, attachAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName, phone } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await dataStore.findUserByEmail(cleanEmail);
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await dataStore.createUser({
      email: cleanEmail,
      passwordHash,
      fullName: fullName.trim(),
      phone: phone?.trim(),
      role: 'CUSTOMER',
    });

    const userSession = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: (user.role?.name || user.role || 'CUSTOMER') as any,
      isVerified: true,
    };

    const token = generateToken(userSession);
    const response = NextResponse.json({
      success: true,
      user: userSession,
      token,
      message: 'Account registered successfully.',
    });

    attachAuthCookie(response, token);
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Registration failed.' },
      { status: 500 }
    );
  }
}
