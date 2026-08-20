'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Calendar as CalendarIcon,
  Receipt,
  Download,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Building,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Tag,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { siteConfig } from '@/config/siteConfig';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoomId?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
}

export function BookingModal({
  isOpen,
  onClose,
  initialRoomId,
  initialCheckIn,
  initialCheckOut,
}: BookingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [checkIn, setCheckIn] = useState(initialCheckIn || '2026-09-10');
  const [checkOut, setCheckOut] = useState(initialCheckOut || '2026-09-13');
  const [guestCount, setGuestCount] = useState(4);
  const [adults, setAdults] = useState(3);
  const [children, setChildren] = useState(1);
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>(initialRoomId);

  // Guest Info State
  const [primaryName, setPrimaryName] = useState('');
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Coupon & Pricing Quote State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  // Booking & Payment State
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [paymentGateway, setPaymentGateway] = useState<'razorpay' | 'stripe'>('razorpay');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [confirmedData, setConfirmedData] = useState<any>(null);

  // Fetch Live Server Quote
  const fetchQuote = useCallback(
    async (couponToApply = appliedCoupon) => {
      setLoadingQuote(true);
      try {
        const res = await fetch('/api/booking/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            villaId: 'villa-suroor-main',
            checkIn,
            checkOut,
            guestCount,
            couponCode: couponToApply || undefined,
            roomId: selectedRoomId,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to calculate pricing quote.');
        setQuote(data);
      } catch (err: any) {
        toast.error(err.message || 'Error updating price.');
      } finally {
        setLoadingQuote(false);
      }
    },
    [appliedCoupon, checkIn, checkOut, guestCount, selectedRoomId]
  );

  useEffect(() => {
    if (isOpen) {
      if (initialCheckIn) setCheckIn(initialCheckIn);
      if (initialCheckOut) setCheckOut(initialCheckOut);
      if (initialRoomId !== undefined) setSelectedRoomId(initialRoomId);
      setStep(1);
    }
  }, [isOpen, initialCheckIn, initialCheckOut, initialRoomId]);

  useEffect(() => {
    if (isOpen) {
      fetchQuote();
    }
  }, [isOpen, fetchQuote]);

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    setAppliedCoupon(couponCode.trim());
    fetchQuote(couponCode.trim());
    toast.success('Applying coupon code...');
  };

  // Step 1 -> Step 2: Validate Dates & Quote
  const handleProceedToGuests = () => {
    if (!quote || !quote.isValid) {
      toast.error(quote?.validationError || 'Please select valid check-in and check-out dates.');
      return;
    }
    setStep(2);
  };

  // Step 2 -> Step 3: Create Server Hold & Proceed to Payment
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryName || !primaryEmail || !primaryPhone) {
      toast.error('Please enter primary guest name, email, and phone number.');
      return;
    }

    setProcessingPayment(true);
    try {
      const res = await fetch('/api/booking/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          villaId: 'villa-suroor-main',
          roomId: selectedRoomId,
          checkIn,
          checkOut,
          guestCount,
          adults,
          children,
          primaryGuest: {
            fullName: primaryName,
            email: primaryEmail,
            phone: primaryPhone,
            idNumber,
          },
          notes,
          couponCode: appliedCoupon || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking hold failed.');

      setCreatedBooking(data.booking);
      toast.success('Temporary booking hold created (15 min lock).');
      setStep(3);
    } catch (err: any) {
      toast.error(err.message || 'Double booking protection triggered.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Helper to load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Step 3 -> Step 4: Real Unified Payment Order & Signature Verification
  const handlePayAndConfirm = async () => {
    if (!createdBooking) return;
    setProcessingPayment(true);

    try {
      // 1. Create Payment Order Server-Side
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: createdBooking.id,
          gateway: paymentGateway,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order on gateway.');
      }

      // 2A. RAZORPAY FRONTEND CHECKOUT
      if (orderData.gateway === 'razorpay') {
        const loaded = await loadRazorpayScript();
        if (!loaded) throw new Error('Razorpay SDK failed to load. Please check connection.');

        const options = {
          key: orderData.keyId,
          amount: Math.round(orderData.amount * 100),
          currency: orderData.currency || 'INR',
          name: 'Suroor Villa Kashmir',
          description: `Booking Reservation #${createdBooking.referenceCode}`,
          order_id: orderData.orderId,
          modal: {
            ondismiss: () => {
              setProcessingPayment(false);
              toast.info('Razorpay payment window closed. Your 15-minute reservation hold remains active.');
            },
          },
          handler: async (response: any) => {
            setProcessingPayment(true);
            await verifyAndConfirmPayment({
              bookingId: createdBooking.id,
              gateway: 'razorpay',
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
          },
          prefill: {
            name: primaryName,
            email: primaryEmail,
            contact: primaryPhone,
          },
          notes: {
            bookingId: createdBooking.id,
            referenceCode: createdBooking.referenceCode,
            guestName: primaryName,
          },
          theme: { color: '#1A2E22' },
          // Explicitly enable and configure UPI, QR Code, Cards, NetBanking, and Wallets
          method: {
            upi: true,
            card: true,
            netbanking: true,
            wallet: true,
          },
          // Razorpay Standard Checkout configuration supporting UPI, Dynamic UPI QR Code, Cards, and NetBanking
          config: {
            display: {
              blocks: {
                upi: {
                  name: 'UPI / QR Code (Google Pay, PhonePe, Paytm, BHIM)',
                  instruments: [
                    {
                      method: 'upi',
                    },
                  ],
                },
                other: {
                  name: 'Cards, NetBanking & Other Methods',
                  instruments: [
                    {
                      method: 'card',
                    },
                    {
                      method: 'netbanking',
                    },
                    {
                      method: 'wallet',
                    },
                  ],
                },
              },
              sequence: ['block.upi', 'block.other'],
              preferences: {
                show_default_blocks: true,
              },
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          setProcessingPayment(false);
          toast.error(
            `Payment declined: ${response.error?.description || 'Transaction failed. Your hold remains active.'}`
          );
        });
        rzp.open();
        return;
      }

      // 2B. STRIPE GATEWAY VERIFICATION
      await verifyAndConfirmPayment({
        bookingId: createdBooking.id,
        gateway: orderData.gateway,
        stripePaymentIntentId: orderData.orderId,
      });
    } catch (err: any) {
      toast.error(err.message || 'Payment creation failed.');
      setProcessingPayment(false);
    }
  };

  const handleReleaseHold = async () => {
    if (!createdBooking?.id) return;
    try {
      await fetch('/api/booking/release-hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: createdBooking.id }),
      });
      toast.info('Temporary reservation hold released.');
      setCreatedBooking(null);
      setStep(1);
      onClose();
    } catch (e) {
      onClose();
    }
  };

  const verifyAndConfirmPayment = async (verifyParams: any) => {
    try {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verifyParams),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Server payment signature verification failed.');
      }

      setConfirmedData({
        booking: {
          ...createdBooking,
          status: 'CONFIRMED',
          referenceCode: data.referenceCode,
        },
        transactionId: data.transactionId,
        invoice: { invoiceNumber: `INV-2026-${createdBooking.id.slice(-4)}` },
      });

      setStep(4);
      toast.success('Payment Verified Server-Side & Stay Confirmed!', {
        description: `Reference Code: ${data.referenceCode}`,
      });
    } catch (err: any) {
      toast.error(err.message || 'Payment verification failed.');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-card border-border shadow-2xl p-6 rounded-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <DialogTitle className="font-serif text-2xl text-foreground flex items-center gap-2">
                <Building className="w-5 h-5 text-accent" />
                Reserve Your Stay at Suroor Villa
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kashmir Private Estate Booking Engine — Verified Real-Time Availability
              </p>
            </div>
          </div>

          {/* Stepper Header */}
          <div className="grid grid-cols-4 gap-2 pt-3 text-center text-xs font-medium">
            <div
              className={`py-1.5 rounded-sm ${
                step === 1 ? 'bg-primary text-primary-foreground font-semibold' : 'bg-muted text-muted-foreground'
              }`}
            >
              1. Dates & Quote
            </div>
            <div
              className={`py-1.5 rounded-sm ${
                step === 2 ? 'bg-primary text-primary-foreground font-semibold' : 'bg-muted text-muted-foreground'
              }`}
            >
              2. Guest Info
            </div>
            <div
              className={`py-1.5 rounded-sm ${
                step === 3 ? 'bg-primary text-primary-foreground font-semibold' : 'bg-muted text-muted-foreground'
              }`}
            >
              3. Payment
            </div>
            <div
              className={`py-1.5 rounded-sm ${
                step === 4 ? 'bg-emerald-700 text-white font-semibold' : 'bg-muted text-muted-foreground'
              }`}
            >
              4. Confirmed
            </div>
          </div>
        </DialogHeader>

        {/* STEP 1: DATES, GUESTS & PRICING BREAKDOWN */}
        {step === 1 && (
          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="chk-in" className="flex items-center gap-1.5 text-xs font-semibold">
                  <CalendarIcon className="w-3.5 h-3.5 text-accent" /> Check-In Date
                </Label>
                <Input
                  id="chk-in"
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="chk-out" className="flex items-center gap-1.5 text-xs font-semibold">
                  <CalendarIcon className="w-3.5 h-3.5 text-accent" /> Check-Out Date
                </Label>
                <Input
                  id="chk-out"
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Total Guests</Label>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Math.min(6, Math.max(1, Number(e.target.value))))}
                />
              </div>
              <div>
                <Label className="text-xs">Adults</Label>
                <Input
                  type="number"
                  min={1}
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="text-xs">Children</Label>
                <Input
                  type="number"
                  min={0}
                  value={children}
                  onChange={(e) => setChildren(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Live Pricing Breakdown Card */}
            <div className="p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-serif text-lg font-semibold text-foreground flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-accent" /> Price Calculation & Breakdown
                </h4>
                <div className="flex items-center gap-2">
                  {loadingQuote ? (
                    <span className="text-xs text-accent animate-pulse">Checking availability...</span>
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
                  ) : null}
                </div>
              </div>

              {quote && !quote.isAvailable && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-xs text-destructive font-medium flex items-center gap-2">
                  <span className="font-bold">Notice:</span> Not available for these dates. Please choose alternative dates.
                </div>
              )}

              {quote && (
                <div className="space-y-2 text-xs divide-y divide-border/60">
                  <div className="flex justify-between pt-1">
                    <span className="text-muted-foreground">
                      Base Rate ({quote.nights} night{quote.nights > 1 ? 's' : ''})
                    </span>
                    <span className="font-medium text-foreground">₹{quote.baseNightlySum?.toLocaleString()}</span>
                  </div>

                  {quote.extraGuestFee > 0 && (
                    <div className="flex justify-between pt-1">
                      <span className="text-muted-foreground">Extra Guest Fee</span>
                      <span className="font-medium text-foreground">₹{quote.extraGuestFee?.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-1">
                    <span className="text-muted-foreground">Cleaning & Sanitization Fee</span>
                    <span className="font-medium text-foreground">₹{quote.cleaningFee?.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between pt-1">
                    <span className="text-muted-foreground">Estate Staff & Butler Service Fee (5%)</span>
                    <span className="font-medium text-foreground">₹{quote.serviceFee?.toLocaleString()}</span>
                  </div>

                  {quote.discountAmount > 0 && (
                    <div className="flex justify-between pt-1 text-emerald-700 font-medium">
                      <span>Coupon Discount ({quote.couponCode})</span>
                      <span>- ₹{quote.discountAmount?.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-1">
                    <span className="text-muted-foreground">GST Taxes (18%)</span>
                    <span className="font-medium text-foreground">₹{quote.taxAmount?.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between pt-2 text-sm font-bold text-foreground">
                    <span>Total Estimated Stay Cost</span>
                    <span className="text-accent text-base">₹{quote.totalAmount?.toLocaleString()} INR</span>
                  </div>
                </div>
              )}

              {/* Coupon Input */}
              <div className="flex gap-2 pt-1">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Enter Coupon Code (e.g. WELCOME10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="pl-8 text-xs bg-background h-8"
                  />
                </div>
                <Button size="sm" variant="outline" onClick={handleApplyCoupon} className="h-8 text-xs">
                  Apply Code
                </Button>
              </div>
            </div>

            <Button
              onClick={handleProceedToGuests}
              disabled={!quote?.isValid}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5"
            >
              Continue to Guest Information <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* STEP 2: GUEST INFORMATION */}
        {step === 2 && (
          <form onSubmit={handleProceedToPayment} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="p-name" className="text-xs">Primary Guest Full Name *</Label>
                <Input
                  id="p-name"
                  required
                  placeholder="e.g. Vikramaditya Sharma"
                  value={primaryName}
                  onChange={(e) => setPrimaryName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="p-email" className="text-xs">Email Address *</Label>
                <Input
                  id="p-email"
                  type="email"
                  required
                  placeholder="vikram@example.com"
                  value={primaryEmail}
                  onChange={(e) => setPrimaryEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="p-phone" className="text-xs">Phone Number *</Label>
                <Input
                  id="p-phone"
                  required
                  placeholder="+91 98765 43210"
                  value={primaryPhone}
                  onChange={(e) => setPrimaryPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="p-id" className="text-xs">Aadhaar / Passport Number (Optional)</Label>
                <Input
                  id="p-id"
                  placeholder="For smooth check-in verification"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="p-notes" className="text-xs">Special Requests / Dietary Requirements</Label>
              <Textarea
                id="p-notes"
                placeholder="e.g., Honeymoon setup, bonfire preference, Kashmiri Wazwan private dinner request..."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-1/3">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                type="submit"
                disabled={processingPayment}
                className="w-2/3 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {processingPayment ? 'Securing Hold...' : 'Proceed to Payment Lock'}
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3: UNIFIED PAYMENT GATEWAY (RAZORPAY / STRIPE / MOCK) */}
        {step === 3 && createdBooking && (
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Temporary Hold Active:</strong> Room locked for 15 minutes under reference{' '}
                <span className="font-bold underline">{createdBooking.referenceCode}</span>.
              </span>
            </div>

            <div className="p-4 bg-muted/40 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between font-medium">
                <span>Estate Stay Total</span>
                <span className="text-accent text-sm font-bold">₹{createdBooking.totalAmount?.toLocaleString()} INR</span>
              </div>
              <p className="text-muted-foreground">
                Dates: {checkIn} to {checkOut} ({createdBooking.nights} nights)
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Select Payment Gateway</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentGateway('razorpay')}
                  className={`p-3 text-left rounded-md border text-xs transition-colors flex flex-col gap-1 ${
                    paymentGateway === 'razorpay'
                      ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-sm'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-bold text-foreground">
                    <Sparkles className="w-3.5 h-3.5 text-accent" /> Razorpay
                  </span>
                  <span className="text-[10px] text-muted-foreground">UPI (GPay/PhonePe/Paytm), Cards, NetBanking</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentGateway('stripe')}
                  className={`p-3 text-left rounded-md border text-xs transition-colors flex flex-col gap-1 ${
                    paymentGateway === 'stripe'
                      ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-sm'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-bold text-foreground">
                    <CreditCard className="w-3.5 h-3.5 text-accent" /> Stripe
                  </span>
                  <span className="text-[10px] text-muted-foreground">International Credit / Debit Cards</span>
                </button>
              </div>
            </div>

            <Button
              onClick={handlePayAndConfirm}
              disabled={processingPayment}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 font-semibold text-sm shadow-sm"
            >
              {processingPayment
                ? 'Processing & Verifying Payment...'
                : paymentGateway === 'razorpay'
                ? `Pay ₹${createdBooking.totalAmount?.toLocaleString()} via Razorpay`
                : `Pay ₹${createdBooking.totalAmount?.toLocaleString()} via Stripe`}
            </Button>

            <button
              type="button"
              onClick={handleReleaseHold}
              className="text-[11px] text-muted-foreground hover:text-foreground text-center w-full block transition-colors underline pt-1"
            >
              Cancel reservation & release temporary hold
            </button>
          </div>
        )}

        {/* STEP 4: CONFIRMED & INVOICE */}
        {step === 4 && confirmedData && (
          <div className="space-y-5 text-center py-4">
            <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif text-2xl font-bold text-foreground">Stay Confirmed!</h3>
              <p className="text-sm text-muted-foreground">
                Your reservation at Suroor Villa is official. Server payment verified.
              </p>
              <p className="text-xs font-mono font-bold text-accent pt-1">
                Reference Code: {confirmedData.booking.referenceCode}
              </p>
            </div>

            <div className="p-4 bg-muted/40 rounded-lg text-left text-xs space-y-2 border border-border">
              <div className="flex justify-between border-b border-border/60 pb-1 font-semibold">
                <span>Invoice Number</span>
                <span>{confirmedData.invoice?.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Primary Guest</span>
                <span>{primaryName}</span>
              </div>
              <div className="flex justify-between">
                <span>Check-in</span>
                <span>{checkIn} (2:00 PM)</span>
              </div>
              <div className="flex justify-between">
                <span>Check-out</span>
                <span>{checkOut} (11:00 AM)</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-2 text-foreground">
                <span>Total Amount Paid</span>
                <span className="text-emerald-700">₹{confirmedData.booking.totalAmount?.toLocaleString()} INR</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <a
                href={`/api/booking/${confirmedData.booking.id}/invoice`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center border border-input bg-background hover:bg-accent hover:text-accent-foreground text-xs font-medium h-9 rounded-md"
              >
                <Download className="w-4 h-4 mr-1.5" /> Official Tax Invoice (PDF)
              </a>
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={onClose}>
                Done
              </Button>
            </div>

            {/* Concierge Assistance Quick Links */}
            <div className="pt-3 border-t border-border/70 flex items-center justify-center gap-4 text-xs">
              <a
                href={siteConfig.getWhatsAppChatLink(`Hello Concierge, I have confirmed booking ${confirmedData.booking.referenceCode}.`)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Butler Desk
              </a>
              <span className="text-border">|</span>
              <a
                href={siteConfig.phoneHref}
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium"
              >
                <Phone className="w-3.5 h-3.5" /> {siteConfig.ownerPhone}
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
