'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/src/components/layout/site-header';
import { SiteFooter } from '@/src/components/layout/site-footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Calendar,
  Users,
  Receipt,
  Download,
  Building,
  ArrowLeft,
  XCircle,
  Clock,
  Search,
} from 'lucide-react';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = async (query?: string) => {
    setLoading(true);
    try {
      const url = new URL('/api/booking/history', window.location.origin);
      if (query) {
        if (query.includes('@')) {
          url.searchParams.set('email', query.trim());
        } else {
          url.searchParams.set('referenceCode', query.trim().toUpperCase());
        }
      }
      const token = typeof window !== 'undefined' ? localStorage.getItem('suroor_auth_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url.toString(), { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load booking history.');
      setBookings(data.bookings || []);
    } catch (err: any) {
      toast.error(err.message || 'Error loading bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory(searchQuery);
  };

  const handleCancel = async (booking: any) => {
    if (!confirm(`Are you sure you want to request cancellation for booking ${booking.referenceCode}?`)) return;
    setCancellingId(booking.id);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('suroor_auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/booking/cancel', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bookingId: booking.id,
          reason: 'Guest requested cancellation via portal',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cancellation failed.');

      toast.success(`Booking cancelled. Refund: ₹${data.refundAmount?.toLocaleString('en-IN')}`);
      fetchHistory();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 pt-28 pb-16 px-5 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-border pb-4">
          <div>
            <Link href="/" className="text-xs text-accent hover:underline flex items-center gap-1 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Estate Homepage
            </Link>
            <h1 className="font-serif text-3xl font-bold text-foreground">My Estate Reservations</h1>
            <p className="text-sm text-muted-foreground mt-1">
              View your booking history, payment records, and estate stay details.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Email or Ref Code (e.g. SUR-)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs bg-card"
                />
              </div>
              <Button type="submit" size="sm" variant="outline" className="h-9 text-xs">
                Search
              </Button>
            </form>

            <Link href="/dashboard">
              <Button size="sm" className="bg-primary text-primary-foreground text-xs w-full sm:w-auto">
                Full Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground animate-pulse">
            Loading your estate reservations...
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center bg-card rounded-lg border border-border space-y-4">
            <Building className="w-12 h-12 text-accent mx-auto" />
            <h3 className="font-serif text-xl font-semibold">No Bookings Found</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              You do not have any active or previous reservations at Suroor Villa yet.
            </p>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/#booking">Reserve Your Stay</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-4 transition-all hover:border-accent/50"
              >
                <div className="flex flex-wrap justify-between items-start gap-4 border-b border-border/60 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-xl font-bold text-foreground">Suroor Villa</span>
                      <Badge
                        variant={
                          b.status === 'CONFIRMED'
                            ? 'default'
                            : b.status === 'CANCELLED'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="capitalize text-xs"
                      >
                        {b.status}
                      </Badge>
                    </div>
                    <p className="text-xs font-mono text-accent mt-1">Ref Code: {b.referenceCode}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-serif text-2xl font-bold text-foreground">₹{b.totalAmount?.toLocaleString()} INR</p>
                    <p className="text-xs text-muted-foreground">GST Inclusive</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-accent" />
                    <div>
                      <p className="font-medium text-foreground">Stay Dates</p>
                      <p className="text-muted-foreground">
                        {new Date(b.checkIn).toLocaleDateString()} — {new Date(b.checkOut).toLocaleDateString()} ({b.nights} nights)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent" />
                    <div>
                      <p className="font-medium text-foreground">Guests</p>
                      <p className="text-muted-foreground">
                        {b.guestCount} Guests ({b.adults} Adults, {b.children} Children)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-accent" />
                    <div>
                      <p className="font-medium text-foreground">Primary Guest</p>
                      <p className="text-muted-foreground">{b.primaryGuest?.fullName || 'Guest'}</p>
                    </div>
                  </div>
                </div>

                {b.notes && (
                  <div className="p-3 bg-muted/40 rounded text-xs text-muted-foreground border border-border/40">
                    <strong className="text-foreground">Special Request Notes:</strong> {b.notes}
                  </div>
                )}

                <div className="flex flex-wrap justify-between items-center gap-3 pt-2 border-t border-border/60">
                  <p className="text-xs text-muted-foreground">
                    Booked on {new Date(b.createdAt).toLocaleDateString()}
                  </p>

                  <div className="flex gap-2">
                    <a
                      href={`/api/booking/${b.id}/invoice`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium border border-border rounded-md hover:bg-muted"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> PDF Invoice
                    </a>

                    {b.status !== 'CANCELLED' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={cancellingId === b.id}
                        onClick={() => handleCancel(b)}
                        className="text-xs"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel Reservation
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
