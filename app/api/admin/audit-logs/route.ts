import { NextRequest, NextResponse } from 'next/server';
import { memStore } from '@/lib/dataStore';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    return NextResponse.json({ success: true, logs: memStore.auditLogs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching audit logs' }, { status: 500 });
  }
}
