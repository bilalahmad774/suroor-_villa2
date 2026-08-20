import { NextRequest, NextResponse } from 'next/server';
import { CancellationEngine } from '@/src/lib/cancellationEngine';
import { verifyJwtToken } from '@/src/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('suroor_auth_token')?.value || req.cookies.get('suroor_token')?.value || req.cookies.get('aaranya_token')?.value || '';
    let userEmail = '';
    let isAdmin = false;

    if (token) {
      const decoded = await verifyJwtToken(token);
      if (decoded) {
        userEmail = decoded.email;
        isAdmin = decoded.role === 'ADMIN' || decoded.role === 'SUPER_ADMIN';
      }
    }

    const body = await req.json();
    const { bookingId, reason, customRefundPercentage, guestEmail } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking ID.' }, { status: 400 });
    }

    const effectiveUserEmail = userEmail || guestEmail || 'guest@example.com';

    // Execute server-side cancellation flow
    const result = await CancellationEngine.processCancellation({
      bookingId,
      userEmail: effectiveUserEmail,
      isAdmin,
      reason: reason || 'Guest requested cancellation',
      customRefundPercentage: isAdmin ? customRefundPercentage : undefined,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to cancel booking.' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Cancellation Endpoint Error:', err);
    return NextResponse.json({ error: err.message || 'Server error processing cancellation.' }, { status: 500 });
  }
}
