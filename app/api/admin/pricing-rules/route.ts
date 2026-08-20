import { NextRequest, NextResponse } from 'next/server';
import { dataStore, memStore } from '@/lib/dataStore';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    return NextResponse.json({ success: true, rules: memStore.pricingRules });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching pricing rules' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const newRule = {
      id: `rule-${Date.now()}`,
      villaId: body.villaId || 'villa-suroor-main',
      name: body.name,
      ruleType: body.ruleType || 'SEASONAL',
      priority: Number(body.priority || 10),
      startDate: body.startDate || undefined,
      endDate: body.endDate || undefined,
      priceMultiplier: body.priceMultiplier ? Number(body.priceMultiplier) : undefined,
      fixedPrice: body.fixedPrice ? Number(body.fixedPrice) : undefined,
      minStayNights: Number(body.minStayNights || 1),
      maxStayNights: body.maxStayNights ? Number(body.maxStayNights) : undefined,
      extraGuestFee: Number(body.extraGuestFee || 2500),
      isWeekendRule: Boolean(body.isWeekendRule),
      isActive: true,
    };

    memStore.pricingRules.push(newRule);

    dataStore.addAuditLog({
      userId: user.id,
      action: 'CREATE_PRICING_RULE',
      entity: 'PricingRule',
      entityId: newRule.id,
      details: `Created pricing rule "${newRule.name}"`,
    });

    return NextResponse.json({ success: true, rule: newRule });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create pricing rule' }, { status: 500 });
  }
}
