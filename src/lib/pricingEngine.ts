import { parseISO, differenceInCalendarDays, eachDayOfInterval, format } from 'date-fns';
import { getAccommodationTitle } from '@/config/pricingConfig';

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
  accommodationName: string;
  nightlyRate: number;
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
  villaBasePrice,
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
  const isEntireVilla = !input.roomId || input.roomId === 'entire-villa';
  const accommodationName = isEntireVilla
    ? 'Entire Villa'
    : getAccommodationTitle(input.roomId);

  // Authoritative base price strictly from passed database values
  const basePricePerNight = isEntireVilla
    ? (typeof villaBasePrice === 'number' ? villaBasePrice : 0)
    : (typeof roomBasePrice === 'number' ? roomBasePrice : 0);

  const start = parseISO(input.checkIn);
  const end = parseISO(input.checkOut);
  const nights = Math.max(1, differenceInCalendarDays(end, start));

  if (nights < 1 || isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      villaId: input.villaId,
      roomId: input.roomId,
      accommodationName,
      nightlyRate: basePricePerNight,
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
      taxRate: 0,
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

  const dayBreakdown: DayBreakdown[] = [];
  let baseNightlySum = 0;

  for (const day of daysInterval) {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayOfWeekStr = format(day, 'EEEE');
    const effectiveRate = basePricePerNight;

    baseNightlySum += effectiveRate;
    dayBreakdown.push({
      date: dateStr,
      dayOfWeek: dayOfWeekStr,
      baseRate: basePricePerNight,
      appliedRuleName: isEntireVilla ? 'Entire Villa Nightly Rate' : 'Room Suite Nightly Rate',
      ruleType: 'BASE',
      effectiveRate,
    });
  }

  const overallMinStay = 1;
  const minStaySatisfied = nights >= overallMinStay;
  const maxStaySatisfied = true;

  // Base subtotal = nights * nightly rate
  const subtotal = baseNightlySum;

  // Extra guest charges (if guest count exceeds standard 2 per suite or 6 for full villa)
  let extraGuestFee = 0;
  const maxStandardGuests = isEntireVilla ? 6 : 2;
  if (input.guestCount > maxStandardGuests) {
    const extraGuests = input.guestCount - maxStandardGuests;
    extraGuestFee = extraGuests * 2500 * nights;
  }

  const cleaningFee = 0; // Included in luxury rate
  const serviceFee = 0; // Direct transparent pricing

  // Coupon discount calculation
  let discountAmount = 0;
  if (coupon && coupon.isActive) {
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else if (coupon.discountType === 'FIXED') {
      discountAmount = Math.min(subtotal, coupon.discountValue);
    }
  }

  const taxableAmount = Math.max(0, subtotal + extraGuestFee + cleaningFee + serviceFee - discountAmount);
  // GST statutory tax (18% for luxury accommodations in India)
  const taxRate = 0.18;
  const taxAmount = Math.round(taxableAmount * taxRate);

  const totalAmount = taxableAmount + taxAmount;

  return {
    villaId: input.villaId,
    roomId: input.roomId,
    accommodationName,
    nightlyRate: basePricePerNight,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    nights,
    guestCount: input.guestCount,
    baseNightlySum,
    extraGuestFee,
    cleaningFee,
    serviceFee,
    subtotal,
    couponCode: coupon ? coupon.code : undefined,
    discountAmount,
    taxableAmount,
    taxRate,
    taxAmount,
    totalAmount,
    currency: 'INR',
    minStaySatisfied,
    minStayNights: overallMinStay,
    maxStaySatisfied,
    dayBreakdown,
    isValid: minStaySatisfied && maxStaySatisfied,
  };
}
