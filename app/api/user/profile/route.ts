import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/src/lib/auth';
import { dataStore } from '@/src/lib/dataStore';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile =
      dataStore.getUserProfile(session.id) ||
      dataStore.getUserProfile(session.email);

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const userBookings = await dataStore.listBookings({ userId: profile.id });

    return NextResponse.json({ profile, bookings: userBookings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error fetching profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const updatedProfile =
      dataStore.updateUserProfile(session.id, {
        fullName: body.fullName,
        phone: body.phone,
      }) ||
      dataStore.updateUserProfile(session.email, {
        fullName: body.fullName,
        phone: body.phone,
      });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error updating profile' }, { status: 500 });
  }
}
