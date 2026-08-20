import { NextResponse } from 'next/server';
import { clearAuthCookieResponse } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
  clearAuthCookieResponse(response.headers);
  return response;
}
