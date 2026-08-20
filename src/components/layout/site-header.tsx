'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Mountain, User, ShieldCheck, CalendarCheck, LogOut, Lock, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { navLinks } from '@/config/content';
import { AuthModal } from '@/components/auth/auth-modal';
import { BookingModal } from '@/components/booking/booking-modal';
import { useBooking } from '@/context/BookingContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { isBookingOpen, bookingOptions, openBooking, closeBooking } = useBooking();

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // User session
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const checkUserSession = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('suroor_auth_token') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/auth/me', { headers });
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
        if (token && res.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('suroor_auth_token');
        }
      }
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUserSession();
  }, [checkUserSession]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('suroor_auth_token');
      }
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.reload();
    } catch {
      // ignore
    }
  };

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-500',
          scrolled || open
            ? 'border-b border-border/60 bg-background/95 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent'
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:h-20">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5" aria-label="Suroor Villa home">
            <span
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
                scrolled || open
                  ? 'border-primary/30 text-primary'
                  : 'border-white/40 text-white'
              )}
            >
              <Mountain className="h-4 w-4" />
            </span>
            <span
              className={cn(
                'font-serif text-xl font-medium tracking-wide-luxe transition-colors',
                scrolled || open ? 'text-foreground' : 'text-white'
              )}
            >
              Suroor Villa
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium tracking-wide transition-colors hover:text-accent',
                  scrolled ? 'text-muted-foreground' : 'text-white/85'
                )}
              >
                {link.label}
              </Link>
            ))}
            {user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
              <Link
                href="/admin"
                className="text-xs font-bold text-accent border border-accent/40 bg-accent/10 px-2.5 py-1 rounded"
              >
                Admin Control
              </Link>
            )}
          </nav>

          {/* Right actions */}
          <div className="hidden items-center gap-3 lg:flex">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'gap-2 text-xs font-medium',
                      scrolled ? 'border-border text-foreground' : 'border-white/40 text-white bg-white/5'
                    )}
                  >
                    <User className="h-3.5 w-3.5 text-accent" />
                    <span>{user.fullName.split(' ')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                  <DropdownMenuLabel className="font-serif">
                    <p className="text-sm font-bold">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground font-sans font-normal">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/my-bookings" className="cursor-pointer flex items-center">
                      <CalendarCheck className="w-4 h-4 mr-2 text-accent" /> My Bookings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer flex items-center">
                      <User className="w-4 h-4 mr-2 text-accent" /> Customer Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer flex items-center font-bold text-accent">
                        <ShieldCheck className="w-4 h-4 mr-2" /> Admin Portal
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                onClick={() => setIsAuthOpen(true)}
                className={cn(
                  'gap-1.5 text-xs',
                  scrolled ? 'text-foreground' : 'text-white hover:bg-white/10'
                )}
              >
                <Lock className="w-3.5 h-3.5 text-accent" /> Sign In
              </Button>
            )}

            <Button
              onClick={() => openBooking()}
              variant={scrolled ? 'default' : 'outline'}
              className={cn(
                !scrolled &&
                  'border-white/40 bg-white/5 text-white backdrop-blur-md hover:bg-white/15'
              )}
            >
              Reserve Stay
            </Button>
          </div>

          {/* Mobile action buttons */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              aria-label="Reserve Stay"
              onClick={() => openBooking()}
              className="flex h-9 px-3.5 items-center rounded-full text-xs font-semibold bg-accent text-accent-foreground shadow-sm transition-transform active:scale-95"
            >
              Reserve
            </button>

            <button
              aria-label="Toggle navigation menu"
              onClick={() => setOpen(!open)}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
                scrolled || open
                  ? 'border-border text-foreground bg-card'
                  : 'border-white/40 text-white bg-white/10'
              )}
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-border bg-background/98 px-6 py-6 lg:hidden backdrop-blur-2xl"
            >
              <nav className="flex flex-col gap-4 text-sm font-medium">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="py-2 text-foreground/90 hover:text-accent border-b border-border/40"
                  >
                    {link.label}
                  </Link>
                ))}

                <Link
                  href="/my-bookings"
                  onClick={() => setOpen(false)}
                  className="py-2 text-foreground/90 hover:text-accent border-b border-border/40 flex items-center justify-between"
                >
                  <span>My Reservations</span>
                  <CalendarCheck className="w-4 h-4 text-accent" />
                </Link>

                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="py-2 text-foreground/90 hover:text-accent border-b border-border/40 flex items-center justify-between"
                >
                  <span>Guest Dashboard</span>
                  <User className="w-4 h-4 text-accent" />
                </Link>

                {user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="py-2 text-accent font-bold border-b border-border/40 flex items-center justify-between"
                  >
                    <span>Admin Control Portal</span>
                    <ShieldCheck className="w-4 h-4" />
                  </Link>
                )}

                <div className="pt-3 flex flex-col gap-2">
                  {user ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-destructive justify-center text-xs"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-1" /> Sign Out ({user.fullName.split(' ')[0]})
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOpen(false);
                        setIsAuthOpen(true);
                      }}
                      className="w-full justify-center text-xs"
                    >
                      <Lock className="w-3.5 h-3.5 mr-1 text-accent" /> Guest Sign In / Register
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={() => {
                      setOpen(false);
                      openBooking();
                    }}
                    className="w-full bg-primary text-primary-foreground text-xs"
                  >
                    Reserve Full Estate
                  </Button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => setUser(u)}
      />

      <BookingModal
        isOpen={isBookingOpen}
        onClose={closeBooking}
        initialRoomId={bookingOptions.roomId}
        initialCheckIn={bookingOptions.checkIn}
        initialCheckOut={bookingOptions.checkOut}
      />
    </>
  );
}
