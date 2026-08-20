import { NextRequest, NextResponse } from 'next/server';
import { dataStore, memStore } from '@/lib/dataStore';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const bookings = await dataStore.listBookings();
    const confirmed = bookings.filter((b) => b.status === 'CONFIRMED');
    const totalRevenue = confirmed.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter((b) => b.status === 'PENDING').length;
    const occupancyRate = 78.5; // percentage occupancy

    const recentActivity = memStore.auditLogs.slice(0, 10);

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue,
        totalBookings,
        confirmedCount: confirmed.length,
        pendingBookings,
        occupancyRate,
      },
      recentActivity,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Overview error' }, { status: 500 });
  }
}
