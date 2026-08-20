import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { comparePassword, generateToken, attachAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await dataStore.findUserByEmail(cleanEmail);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const userSession = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: (user.role?.name || user.role || 'CUSTOMER') as any,
      isVerified: user.isVerified ?? true,
    };

    const token = generateToken(userSession);
    const response = NextResponse.json({
      success: true,
      user: userSession,
      token,
      message: 'Logged in successfully.',
    });

    attachAuthCookie(response, token);
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Login failed.' },
      { status: 500 }
    );
  }
}
