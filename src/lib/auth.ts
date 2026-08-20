import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'suroor-villa-super-secret-jwt-key-2026';
export const TOKEN_COOKIE_NAME = 'suroor_auth_token';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
  isVerified: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}

export function generateToken(user: UserSession): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isVerified: user.isVerified,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): UserSession | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserSession;
    return decoded;
  } catch {
    return null;
  }
}

export const verifyJwtToken = verifyToken;

export async function getSessionUser(req?: NextRequest): Promise<UserSession | null> {
  try {
    // 1. Check req Authorization header if passed
    if (req) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        const user = verifyToken(token);
        if (user) return user;
      }
      const cookieToken =
        req.cookies.get(TOKEN_COOKIE_NAME)?.value ||
        req.cookies.get('suroor_token')?.value ||
        req.cookies.get('aaranya_token')?.value;
      if (cookieToken) {
        const user = verifyToken(cookieToken);
        if (user) return user;
      }
    }

    // 2. Next.js header cookies
    try {
      const cookieStore = await cookies();
      const token =
        (typeof cookieStore.get === 'function'
          ? cookieStore.get(TOKEN_COOKIE_NAME)?.value ||
            cookieStore.get('suroor_token')?.value ||
            cookieStore.get('aaranya_token')?.value
          : (cookieStore as any)[TOKEN_COOKIE_NAME]?.value) || '';

      if (token) {
        const user = verifyToken(token);
        if (user) return user;
      }
    } catch {}

    return null;
  } catch {
    return null;
  }
}

export function setAuthCookieResponse(responseHeader: Headers, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const secureFlag = isProd ? '; Secure' : '';
  responseHeader.append(
    'Set-Cookie',
    `${TOKEN_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}${secureFlag}`
  );
}

export function attachAuthCookie(response: NextResponse, token: string) {
  setAuthCookieResponse(response.headers, token);
  try {
    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600,
      secure: process.env.NODE_ENV === 'production',
    });
  } catch {}
}

export function clearAuthCookieResponse(responseHeader: Headers) {
  const isProd = process.env.NODE_ENV === 'production';
  const secureFlag = isProd ? '; Secure' : '';
  responseHeader.append(
    'Set-Cookie',
    `${TOKEN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`
  );
}

export function removeAuthCookie(response: NextResponse) {
  clearAuthCookieResponse(response.headers);
  try {
    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: '',
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 0,
      secure: process.env.NODE_ENV === 'production',
    });
  } catch {}
}
