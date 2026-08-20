import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  // Fetch real record from database/store to ensure accurate name and data
  const realUser =
    (await dataStore.findUserById(session.id)) ||
    (await dataStore.findUserByEmail(session.email));

  if (!realUser) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  const userSession = {
    id: realUser.id,
    email: realUser.email,
    fullName: realUser.fullName,
    phone: realUser.phone || '',
    role: (realUser.role?.name || realUser.role || 'CUSTOMER') as any,
    isVerified: realUser.isVerified ?? true,
  };

  return NextResponse.json({ authenticated: true, user: userSession });
}
