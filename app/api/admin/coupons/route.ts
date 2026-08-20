import { NextRequest, NextResponse } from 'next/server';
import { dataStore, memStore } from '@/lib/dataStore';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    return NextResponse.json({ success: true, coupons: memStore.coupons });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching coupons' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const newCoupon = {
      id: `cpn-${Date.now()}`,
      code: body.code.toUpperCase(),
      description: body.description || '',
      discountType: body.discountType || 'PERCENTAGE',
      discountValue: Number(body.discountValue),
      minBookingValue: Number(body.minBookingValue || 0),
      maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : undefined,
      validFrom: body.validFrom || new Date().toISOString().split('T')[0],
      validUntil: body.validUntil || '2026-12-31',
      usageLimit: Number(body.usageLimit || 100),
      usedCount: 0,
      isActive: true,
    };

    memStore.coupons.push(newCoupon);

    dataStore.addAuditLog({
      userId: user.id,
      action: 'CREATE_COUPON',
      entity: 'Coupon',
      entityId: newCoupon.id,
      details: `Created coupon code ${newCoupon.code}`,
    });

    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create coupon' }, { status: 500 });
  }
}
