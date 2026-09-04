import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  // Fetch real record from database/store if available
  const realUser =
    (await dataStore.findUserById(session.id)) ||
    (await dataStore.findUserByEmail(session.email));

  const userSession = {
    id: realUser ? realUser.id : session.id,
    email: realUser ? realUser.email : session.email,
    fullName: (realUser && realUser.fullName) ? realUser.fullName : session.fullName,
    phone: realUser?.phone || '',
    role: (realUser?.role?.name || realUser?.role || session.role || 'CUSTOMER') as any,
    isVerified: realUser?.isVerified ?? session.isVerified ?? true,
  };

  return NextResponse.json({ authenticated: true, user: userSession });
}
