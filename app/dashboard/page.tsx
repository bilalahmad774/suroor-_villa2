'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Calendar,
  CreditCard,
  Download,
  User,
  Star,
  Bell,
  Settings,
  Building,
  ArrowRight,
  RefreshCw,
  XCircle,
  Clock,
  ShieldCheck,
  Phone,
  Mail,
  CheckCircle2,
} from 'lucide-react';

export default function CustomerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Profile Edit State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Cancellation Modal State
  const [cancellingBooking, setCancellingBooking] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Review State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('suroor_auth_token') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/user/profile', { headers });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setFullName(data.profile.fullName || '');
        setPhone(data.profile.phone || '');
        setBookings(data.bookings || []);
      } else {
        setProfile(null);
        setFullName('');
        setPhone('');
        setBookings([]);
      }
    } catch {
      toast.error('Error loading dashboard data.');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('suroor_auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ fullName, phone }),
      });
      if (!res.ok) throw new Error('Failed to update profile.');
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setFullName(data.profile.fullName || '');
        setPhone(data.profile.phone || '');
      }
      toast.success('Profile updated successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Error saving profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;
    setCancelling(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('suroor_auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/booking/cancel', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bookingId: cancellingBooking.id,
          reason: cancelReason || 'Requested via Guest Dashboard',
          guestEmail: profile?.email || '',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel booking.');

      toast.success(`Booking cancelled. Refund amount: ₹${data.refundAmount?.toLocaleString('en-IN') || 0}`);
      setCancellingBooking(null);
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err.message || 'Cancellation failed.');
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('suroor_auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/user/reviews', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          guestName: profile?.fullName || fullName || 'Guest',
          rating: reviewRating,
          comment: reviewComment,
          userEmail: profile?.email || '',
        }),
      });

      if (!res.ok) throw new Error('Failed to submit review.');
      toast.success('Thank you for sharing your review of Suroor Villa!');
      setReviewComment('');
    } catch (err: any) {
      toast.error(err.message || 'Error submitting review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const upcomingBookings = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING');
  const pastBookings = bookings.filter((b) => b.status === 'COMPLETED' || b.status === 'CANCELLED');

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-6 gap-4">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground flex items-center gap-2">
              <Building className="w-8 h-8 text-accent" /> Guest Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back, {profile?.fullName || 'Valued Guest'}. Manage your stays, invoices, and preferences.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchDashboardData} className="gap-1.5 text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
            </Button>
            <Link href="/">
              <Button size="sm" className="bg-primary text-primary-foreground gap-1.5 text-xs">
                Browse Rooms <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Dashboard Main Tabs */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-muted p-1 rounded-lg">
            <TabsTrigger value="upcoming" className="text-xs gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Upcoming Stays ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="text-xs gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Past History ({pastBookings.length})
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-xs gap-1.5">
              <User className="w-3.5 h-3.5" /> Profile & Details
            </TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs gap-1.5">
              <Star className="w-3.5 h-3.5" /> Submit Review
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs gap-1.5">
              <Bell className="w-3.5 h-3.5" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs gap-1.5">
              <Settings className="w-3.5 h-3.5" /> Account Settings
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: UPCOMING BOOKINGS */}
          <TabsContent value="upcoming" className="pt-6 space-y-4">
            {upcomingBookings.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-border rounded-lg space-y-3 bg-card">
                <Calendar className="w-10 h-10 text-muted-foreground mx-auto" />
                <h3 className="font-serif text-lg font-bold">No Upcoming Stays Found</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  You have no active or upcoming reservations at Suroor Villa Kashmir. Book a stay to experience mountain luxury.
                </p>
                <Link href="/#booking">
                  <Button size="sm" className="bg-primary text-primary-foreground">
                    Reserve Dates Now
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {upcomingBookings.map((b) => (
                  <div key={b.id} className="p-6 rounded-lg border border-border bg-card shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row justify-between md:items-center border-b border-border pb-3 gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-accent">{b.referenceCode}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                            {b.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Check-in: {new Date(b.checkIn).toLocaleDateString()} (2:00 PM) → Check-out: {new Date(b.checkOut).toLocaleDateString()} (11:00 AM)
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`/api/booking/${b.id}/invoice`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium border border-border rounded-md hover:bg-muted"
                        >
                          <Download className="w-3.5 h-3.5 mr-1" /> Tax Invoice
                        </a>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setCancellingBooking(b)}
                        >
                          Cancel Stay
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground block">Guest Count</span>
                        <span className="font-semibold">{b.guestCount} Guests</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Duration</span>
                        <span className="font-semibold">{b.nights} Night(s)</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Total Amount</span>
                        <span className="font-semibold text-accent">₹{b.totalAmount?.toLocaleString()} INR</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Payment Method</span>
                        <span className="font-semibold">{b.paymentGateway || 'Card / UPI'}</span>
                      </div>
                    </div>

                    {b.notes && (
                      <div className="p-3 bg-muted/40 rounded text-xs text-muted-foreground italic">
                        &quot;Special Request: {b.notes}&quot;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: PAST HISTORY & CANCELLATIONS */}
          <TabsContent value="past" className="pt-6 space-y-4">
            {pastBookings.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-border rounded-lg bg-card text-muted-foreground">
                No past stay history or cancelled bookings on record.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pastBookings.map((b) => (
                  <div key={b.id} className="p-5 rounded-lg border border-border bg-card space-y-3">
                    <div className="flex justify-between items-center border-b border-border pb-2">
                      <span className="font-mono text-xs font-bold">{b.referenceCode}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground block">Dates</span>
                        <span>{new Date(b.checkIn).toLocaleDateString()} - {new Date(b.checkOut).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Paid Amount</span>
                        <span>₹{b.totalAmount?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Refund Status</span>
                        <span>{b.refundStatus || 'N/A'}</span>
                      </div>
                      <div>
                        <a
                          href={`/api/booking/${b.id}/invoice`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent underline text-xs font-medium"
                        >
                          View Archived Invoice
                        </a>
                      </div>
                    </div>

                    {b.cancellationReason && (
                      <div className="p-2.5 bg-red-500/10 rounded text-xs text-red-900 dark:text-red-200">
                        <strong>Cancellation Policy & Reason:</strong> {b.cancellationReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 3: USER PROFILE */}
          <TabsContent value="profile" className="pt-6">
            <div className="max-w-xl mx-auto p-6 border border-border rounded-lg bg-card space-y-4">
              <h3 className="font-serif text-xl font-bold flex items-center gap-2">
                <User className="w-5 h-5 text-accent" /> Guest Profile & Contact Information
              </h3>

              <form onSubmit={handleUpdateProfile} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="usr-name" className="text-xs">Full Name</Label>
                  <Input
                    id="usr-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="usr-email" className="text-xs">Email Address (Read Only)</Label>
                  <Input id="usr-email" value={profile?.email || ''} disabled className="bg-muted" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="usr-phone" className="text-xs">Phone Number</Label>
                  <Input
                    id="usr-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <Button type="submit" disabled={savingProfile} className="w-full bg-primary text-primary-foreground">
                  {savingProfile ? 'Saving Changes...' : 'Save Profile Updates'}
                </Button>
              </form>
            </div>
          </TabsContent>

          {/* TAB 4: SUBMIT REVIEWS */}
          <TabsContent value="reviews" className="pt-6">
            <div className="max-w-xl mx-auto p-6 border border-border rounded-lg bg-card space-y-4">
              <h3 className="font-serif text-xl font-bold flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" /> Share Your Stay Experience
              </h3>

              <form onSubmit={handleSubmitReview} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Star Rating</Label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`text-2xl transition-transform hover:scale-110 ${
                          star <= reviewRating ? 'text-amber-400' : 'text-muted-foreground'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rev-text" className="text-xs">Your Review & Comments</Label>
                  <textarea
                    id="rev-text"
                    required
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell us about the hospitality, chef Ghulam's Kashmiri Kahwa, pine mountain views..."
                    className="w-full p-3 rounded-md bg-background border border-input text-xs"
                  />
                </div>

                <Button type="submit" disabled={submittingReview} className="w-full bg-primary text-primary-foreground">
                  {submittingReview ? 'Submitting Review...' : 'Publish Guest Review'}
                </Button>
              </form>
            </div>
          </TabsContent>

          {/* TAB 5: NOTIFICATIONS */}
          <TabsContent value="notifications" className="pt-6">
            <div className="max-w-2xl mx-auto space-y-3">
              <div className="p-4 rounded-lg border border-border bg-card flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-xs">GST Tax Invoice Generated</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Official tax invoice complies with 18% GST regulations and is ready for download.
                  </p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">Just now</span>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border bg-card flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-xs">Pre-Arrival Concierge Contact</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Our butler team is standing by to organize your airport transfer and bonfire requests.
                  </p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">1 hour ago</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 6: ACCOUNT SETTINGS */}
          <TabsContent value="settings" className="pt-6">
            <div className="max-w-md mx-auto p-6 border border-border rounded-lg bg-card space-y-4 text-xs">
              <h3 className="font-serif text-lg font-bold">Account Security & Preferences</h3>
              <p className="text-muted-foreground">
                Your account is protected by server-side JWT cookie authentication and encrypted password hashing.
              </p>
              <div className="p-3 bg-muted rounded space-y-1">
                <span className="font-semibold block">GSTIN / Tax Invoicing Preference</span>
                <span>Configured for Jammu & Kashmir Tourism Regulations (18% GST).</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* CANCELLATION MODAL */}
      {cancellingBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-red-600 font-serif text-lg font-bold">
              <XCircle className="w-5 h-5" /> Cancel Reservation #{cancellingBooking.referenceCode}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Cancellation refund will be calculated server-side based on the check-in timeline (Free cancellation if &gt;7 days prior; 50% refund if 3–7 days prior).
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="cnc-reason" className="text-xs">Reason for Cancellation</Label>
              <Input
                id="cnc-reason"
                placeholder="e.g. Flight schedule change"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setCancellingBooking(null)}>
                Keep Reservation
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={cancelling}
                onClick={handleCancelBooking}
              >
                {cancelling ? 'Calculating Refund...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
