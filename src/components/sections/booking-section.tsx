'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Users,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Phone,
  MessageCircle,
  Tag,
  BedDouble,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { villaInfo, rooms as suites } from '@/config/content';
import { siteConfig } from '@/config/siteConfig';
import { useBooking } from '@/context/BookingContext';

function getDefaultStayDates() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const checkOut = new Date();
  checkOut.setDate(checkOut.getDate() + 4);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return {
    checkIn: fmt(tomorrow),
    checkOut: fmt(checkOut),
  };
}

export function BookingSection() {
  const { openBooking } = useBooking();
  const defaultDates = getDefaultStayDates();

  // Selected parameters
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>('entire-villa');
  const [checkIn, setCheckIn] = useState<string>(defaultDates.checkIn);
  const [checkOut, setCheckOut] = useState<string>(defaultDates.checkOut);
  const [adults, setAdults] = useState<number>(3);
  const [children, setChildren] = useState<number>(1);
  const guestCount = adults + children;

  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<string>('');
  const [quote, setQuote] = useState<any>(null);
  const [loadingQuote, setLoadingQuote] = useState<boolean>(false);

  // Fetch real-time price quote from backend
  const fetchPriceQuote = useCallback(
    async (couponToUse = appliedCoupon) => {
      setLoadingQuote(true);
      try {
        const roomId = selectedSuiteId === 'entire-villa' ? undefined : selectedSuiteId;
        const res = await fetch('/api/booking/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            villaId: 'villa-suroor-main',
            roomId,
            checkIn,
            checkOut,
            guestCount,
            couponCode: couponToUse || undefined,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setQuote(data);
        } else {
          setQuote(null);
        }
      } catch (err) {
        console.error('Failed to calculate quote', err);
      } finally {
        setLoadingQuote(false);
      }
    },
    [appliedCoupon, checkIn, checkOut, guestCount, selectedSuiteId]
  );

  useEffect(() => {
    fetchPriceQuote();
  }, [fetchPriceQuote]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setAppliedCoupon(couponCode.trim());
    fetchPriceQuote(couponCode.trim());
    toast.success(`Applying coupon ${couponCode.trim()}...`);
  };

  const handleStartBooking = () => {
    const roomId = selectedSuiteId === 'entire-villa' ? undefined : selectedSuiteId;
    openBooking({
      roomId,
      checkIn,
      checkOut,
      guestCount,
      adults,
      children,
      couponCode: appliedCoupon || undefined,
    });
  };

  return (
    <section id="booking" className="relative scroll-mt-20 py-24 lg:py-32 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-3 px-3 py-1 text-[11px] font-semibold tracking-widest text-accent uppercase border-accent/40 bg-accent/5">
            Reservations & Availability
          </Badge>
          <h2 className="font-serif text-3xl sm:text-5xl font-light text-foreground tracking-tight">
            Reserve Your Private Stay
          </h2>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed text-pretty">
            Suroor Villa offers single-group exclusivity in the pine hills of Tangmarg. Select your desired dates to check live availability and receive an itemized quote.
          </p>
        </div>

        {/* Interactive Booking Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form & Date Picker Controls */}
          <div className="lg:col-span-7 bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/60 pb-5 mb-6">
              <div>
                <h3 className="font-serif text-xl font-medium text-foreground">Select Stay Configuration</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Customise your suite or reserve the entire estate</p>
              </div>
              <Badge className="bg-primary text-primary-foreground text-xs font-normal">
                Entire Villa (6 Guests Max)
              </Badge>
            </div>

            <div className="space-y-6">
              {/* Suite / Property Option */}
              <div>
                <Label className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 block">
                  Accommodation Type
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedSuiteId('entire-villa')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      selectedSuiteId === 'entire-villa'
                        ? 'border-accent bg-accent/10 text-foreground ring-1 ring-accent'
                        : 'border-border bg-card/50 text-muted-foreground hover:border-accent/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-xs text-foreground flex items-center gap-1.5">
                        <BedDouble className="w-3.5 h-3.5 text-accent" /> Entire Private Estate
                      </span>
                      <span className="text-[10px] font-bold text-accent">Best Value</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      All 3 luxury suites & exclusive property grounds
                    </p>
                  </button>

                  {suites.map((suite) => (
                    <button
                      key={suite.id}
                      type="button"
                      onClick={() => setSelectedSuiteId(suite.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        selectedSuiteId === suite.id
                          ? 'border-accent bg-accent/10 text-foreground ring-1 ring-accent'
                          : 'border-border bg-card/50 text-muted-foreground hover:border-accent/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs text-foreground truncate max-w-[150px]">
                          {suite.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Up to {suite.capacity} guests</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 truncate">
                        {suite.view} • {suite.bathroom}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="booking-checkin" className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-accent" /> Check-in Date
                  </Label>
                  <Input
                    id="booking-checkin"
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="h-11 text-sm bg-background border-border"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">Check-in from 2:00 PM</span>
                </div>

                <div>
                  <Label htmlFor="booking-checkout" className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-accent" /> Check-out Date
                  </Label>
                  <Input
                    id="booking-checkout"
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn || new Date().toISOString().split('T')[0]}
                    className="h-11 text-sm bg-background border-border"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">Check-out by 11:00 AM</span>
                </div>
              </div>

              {/* Guest Counts */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 pt-2 border-t border-border/50">
                <div>
                  <Label className="text-xs font-medium text-foreground mb-1.5 block">Adults (Age 12+)</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      className="h-9 w-9 p-0"
                    >
                      -
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{adults}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAdults(Math.min(6, adults + 1))}
                      className="h-9 w-9 p-0"
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-foreground mb-1.5 block">Children (0 - 11 yrs)</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      className="h-9 w-9 p-0"
                    >
                      -
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{children}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setChildren(Math.min(4, children + 1))}
                      className="h-9 w-9 p-0"
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              {/* Promo code bar */}
              <div className="pt-2">
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      placeholder="Promotional code (e.g. WELCOME10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="pl-8 h-10 text-xs bg-background uppercase font-mono"
                    />
                  </div>
                  <Button type="submit" variant="secondary" size="sm" className="h-10 text-xs px-4">
                    Apply Code
                  </Button>
                </form>
                {appliedCoupon && (
                  <p className="text-[11px] text-emerald-600 mt-1.5 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Coupon &ldquo;{appliedCoupon}&rdquo; active on quote
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Live Quote Preview & Booking Action */}
          <div className="lg:col-span-5 bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
              <h3 className="font-serif text-lg font-medium text-foreground">Live Rate Estimate</h3>
              {loadingQuote ? (
                <span className="text-xs text-muted-foreground animate-pulse">Checking availability...</span>
              ) : quote ? (
                quote.isAvailable ? (
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px] font-medium">
                    ✓ Available.
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-[11px]">
                    Not available for these dates.
                  </Badge>
                )
              ) : (
                <Badge variant="outline" className="text-[11px]">
                  Select dates
                </Badge>
              )}
            </div>

            {quote ? (
              <div className="space-y-4">
                {!quote.isAvailable && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-xs text-destructive font-medium">
                    Not available for these dates.
                  </div>
                )}

                <div className="space-y-2.5 text-xs text-muted-foreground pb-4 border-b border-border/60">
                  <div className="flex justify-between">
                    <span>
                      ₹{(quote.nightlyRate || quote.baseNightlyRate || (quote.nights ? Math.round(quote.baseNightlySum / quote.nights) : 15000))?.toLocaleString('en-IN')} × {quote.nights} night
                      {quote.nights > 1 ? 's' : ''}
                    </span>
                    <span className="font-semibold text-foreground">
                      ₹{(quote.roomCharges || quote.baseNightlySum)?.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {quote.cleaningFee > 0 && (
                    <div className="flex justify-between">
                      <span>Cleaning & Private Chef Coordination</span>
                      <span className="font-medium text-foreground">
                        ₹{quote.cleaningFee?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {quote.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount ({quote.appliedCoupon?.code || quote.couponCode || 'Promo'})</span>
                      <span>-₹{quote.discountAmount?.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {quote.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Statutory Taxes</span>
                      <span className="font-medium text-foreground">
                        ₹{quote.taxAmount?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-xs text-muted-foreground block">Final Booking Total</span>
                    <span className="text-[11px] text-muted-foreground">Transparent pricing • No hidden fees</span>
                  </div>
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                    ₹{(quote.totalAmount ?? quote.totalPayable)?.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Primary Booking Button */}
                <div className="pt-3 space-y-2.5">
                  <Button
                    onClick={() => {
                      if (!quote.isAvailable) {
                        toast.error('Not available for these dates.');
                        return;
                      }
                      handleStartBooking();
                    }}
                    disabled={!quote.isAvailable}
                    size="lg"
                    className="w-full bg-primary text-primary-foreground hover:bg-accent hover:text-primary-foreground font-medium text-sm h-12 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Proceed to Reservation & Payment</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>

                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Razorpay & Stripe
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-accent" /> Instant Confirmation
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground space-y-3">
                <Info className="w-6 h-6 mx-auto text-accent" />
                <p>Select check-in and check-out dates to generate a real-time stay estimate.</p>
                <Button onClick={handleStartBooking} variant="outline" size="sm" className="text-xs">
                  Open Booking Engine
                </Button>
              </div>
            )}

            {/* Estate Concierge Quick Bar */}
            <div className="mt-6 pt-5 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-muted-foreground">Prefer personal assistance?</span>
              <div className="flex items-center gap-2">
                <a
                  href={siteConfig.phoneHref}
                  className="inline-flex items-center gap-1 text-primary hover:text-accent font-medium"
                >
                  <Phone className="w-3 h-3" /> Call Concierge
                </a>
                <span className="text-border">|</span>
                <a
                  href={siteConfig.whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  <MessageCircle className="w-3 h-3" /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Guarantee Points */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border/60">
          <div className="flex items-start gap-3 p-3">
            <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-foreground">Exclusive Single Group Stay</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">No shared amenities. The entire pine estate is yours.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3">
            <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-foreground">Dedicated Chef & Wazwan</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Bespoke Kashmiri dining, kahwa tea service, and breakfast included.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3">
            <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-foreground">Transparent Tax Invoices</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Instant GST invoice generation and clear refund guarantees.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
