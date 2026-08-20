import { parseISO, differenceInCalendarDays, eachDayOfInterval, isWeekend, format } from 'date-fns';

export interface PricingInput {
  villaId: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  guestCount: number;
  couponCode?: string;
  roomId?: string;
}

export interface DayBreakdown {
  date: string;
  dayOfWeek: string;
  baseRate: number;
  appliedRuleName: string;
  ruleType: string;
  effectiveRate: number;
}

export interface PricingQuote {
  villaId: string;
  roomId?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestCount: number;
  baseNightlySum: number;
  extraGuestFee: number;
  cleaningFee: number;
  serviceFee: number;
  subtotal: number;
  couponCode?: string;
  discountAmount: number;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  minStaySatisfied: boolean;
  minStayNights: number;
  maxStaySatisfied: boolean;
  maxStayNights?: number;
  dayBreakdown: DayBreakdown[];
  isValid: boolean;
  validationError?: string;
}

export interface Rule {
  id: string;
  villaId: string;
  name: string;
  ruleType: 'BASE' | 'WEEKEND' | 'SEASONAL' | 'HOLIDAY' | 'SPECIAL_DISCOUNT';
  priority: number;
  startDate?: string;
  endDate?: string;
  priceMultiplier?: number;
  fixedPrice?: number;
  minStayNights?: number;
  maxStayNights?: number;
  extraGuestFee?: number;
  isWeekendRule?: boolean;
  isActive: boolean;
}

export interface CouponData {
  id: string;
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minBookingValue?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
}

export function calculateBookingPrice({
  villaBasePrice = 45000,
  roomBasePrice,
  pricingRules = [],
  coupon,
  input,
}: {
  villaBasePrice?: number;
  roomBasePrice?: number;
  pricingRules?: Rule[];
  coupon?: CouponData | null;
  input: PricingInput;
}): PricingQuote {
  const start = parseISO(input.checkIn);
  const end = parseISO(input.checkOut);
  const nights = Math.max(1, differenceInCalendarDays(end, start));

  if (nights < 1 || isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      villaId: input.villaId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      nights: 0,
      guestCount: input.guestCount,
      baseNightlySum: 0,
      extraGuestFee: 0,
      cleaningFee: 0,
      serviceFee: 0,
      subtotal: 0,
      discountAmount: 0,
      taxableAmount: 0,
      taxRate: 18,
      taxAmount: 0,
      totalAmount: 0,
      currency: 'INR',
      minStaySatisfied: false,
      minStayNights: 1,
      maxStaySatisfied: true,
      dayBreakdown: [],
      isValid: false,
      validationError: 'Invalid check-in or check-out date.',
    };
  }

  // Get days in interval (excluding check-out day)
  const daysInterval = eachDayOfInterval({
    start,
    end: new Date(end.getTime() - 24 * 60 * 60 * 1000),
  });

  const basePricePerNight = roomBasePrice || villaBasePrice;
  let overallMinStay = 2; // Default villa min stay
  let overallMaxStay: number | undefined = undefined;

  const dayBreakdown: DayBreakdown[] = [];
  let baseNightlySum = 0;

  // Active rules for this villa
  const activeRules = pricingRules.filter((r) => r.isActive);

  for (const day of daysInterval) {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayOfWeekStr = format(day, 'EEEE');
    const isWknd = isWeekend(day);

    let applicableRule: Rule | null = null;
    let highestPriority = -1;

    // Find highest priority matching rule for this day
    for (const rule of activeRules) {
      let matches = false;

      if (rule.ruleType === 'WEEKEND' && isWknd) {
        matches = true;
      } else if (rule.startDate && rule.endDate) {
        const rStart = parseISO(rule.startDate);
        const rEnd = parseISO(rule.endDate);
        if (day >= rStart && day <= rEnd) {
          matches = true;
        }
      } else if (rule.ruleType === 'BASE') {
        matches = true;
      }

      if (matches && rule.priority > highestPriority) {
        highestPriority = rule.priority;
        applicableRule = rule;
      }
    }

    let effectiveRate = basePricePerNight;
    let ruleName = 'Standard Base Rate';
    let ruleType = 'BASE';

    if (applicableRule) {
      ruleName = applicableRule.name;
      ruleType = applicableRule.ruleType;

      if (applicableRule.fixedPrice !== undefined && applicableRule.fixedPrice !== null) {
        effectiveRate = applicableRule.fixedPrice;
      } else if (applicableRule.priceMultiplier) {
        effectiveRate = Math.round(basePricePerNight * applicableRule.priceMultiplier);
      }

      if (applicableRule.minStayNights && applicableRule.minStayNights > overallMinStay) {
        overallMinStay = applicableRule.minStayNights;
      }
      if (applicableRule.maxStayNights) {
        overallMaxStay = applicableRule.maxStayNights;
      }
    }

    baseNightlySum += effectiveRate;
    dayBreakdown.push({
      date: dateStr,
      dayOfWeek: dayOfWeekStr,
      baseRate: basePricePerNight,
      appliedRuleName: ruleName,
      ruleType,
      effectiveRate,
    });
  }

  // Min and max stay checks
  const minStaySatisfied = nights >= overallMinStay;
  const maxStaySatisfied = !overallMaxStay || nights <= overallMaxStay;

  // Extra guest fee calculation (e.g. guests > 8: 2500 per extra guest per night)
  const baseCapacity = 8;
  const extraGuests = Math.max(0, input.guestCount - baseCapacity);
  const extraGuestFeePerNight = 2500;
  const totalExtraGuestFee = extraGuests * extraGuestFeePerNight * nights;

  // Standard fixed fees
  const cleaningFee = 3500;
  const serviceFee = Math.round(baseNightlySum * 0.05); // 5% service fee
  const subtotal = baseNightlySum + totalExtraGuestFee + cleaningFee + serviceFee;

  // Discount calculation
  let discountAmount = 0;
  if (coupon && coupon.isActive) {
    const couponFrom = parseISO(coupon.validFrom);
    const couponUntil = parseISO(coupon.validUntil);
    const now = new Date();

    if (now >= couponFrom && now <= couponUntil) {
      if (!coupon.minBookingValue || subtotal >= coupon.minBookingValue) {
        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
          }
        } else if (coupon.discountType === 'FIXED') {
          discountAmount = coupon.discountValue;
        }
      }
    }
  }

  // Ensure discount doesn't exceed subtotal
  discountAmount = Math.min(subtotal, Math.max(0, discountAmount));

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxRate = 18; // 18% GST in India for luxury hospitality
  const taxAmount = Math.round((taxableAmount * taxRate) / 100);
  const totalAmount = taxableAmount + taxAmount;

  let isValid = true;
  let validationError: string | undefined = undefined;

  if (!minStaySatisfied) {
    isValid = false;
    validationError = `Minimum stay required for these dates is ${overallMinStay} night${overallMinStay > 1 ? 's' : ''}.`;
  } else if (!maxStaySatisfied && overallMaxStay) {
    isValid = false;
    validationError = `Maximum stay allowed is ${overallMaxStay} night${overallMaxStay > 1 ? 's' : ''}.`;
  }

  return {
    villaId: input.villaId,
    roomId: input.roomId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    nights,
    guestCount: input.guestCount,
    baseNightlySum,
    extraGuestFee: totalExtraGuestFee,
    cleaningFee,
    serviceFee,
    subtotal,
    couponCode: coupon?.code,
    discountAmount,
    taxableAmount,
    taxRate,
    taxAmount,
    totalAmount,
    currency: 'INR',
    minStaySatisfied,
    minStayNights: overallMinStay,
    maxStaySatisfied,
    maxStayNights: overallMaxStay,
    dayBreakdown,
    isValid,
    validationError,
  };
}
