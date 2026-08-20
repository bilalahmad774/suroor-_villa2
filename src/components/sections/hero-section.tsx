'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Users, BedDouble, MapPin, CalendarCheck } from 'lucide-react';
import { getHeroImage } from '@/config/imageConfig';
import { villaInfo } from '@/config/content';
import { useBooking } from '@/context/BookingContext';

export function HeroSection() {
  const reduce = useReducedMotion();
  const hero = getHeroImage('hero');
  const { openBooking } = useBooking();

  return (
    <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src={hero.src}
          alt={hero.alt}
          fill
          sizes="100vw"
          priority
          className={`${reduce ? '' : 'animate-kenburns'} h-full w-full object-cover`}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-28 sm:px-8 lg:pb-36">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 32 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="max-w-2xl"
        >
          <p className="mb-5 flex items-center gap-2 text-xs font-medium uppercase tracking-luxe text-white/80">
            <MapPin className="h-3.5 w-3.5 text-accent" />
            {villaInfo.location}
          </p>
          <h1 className="font-serif text-4xl font-light leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            A private villa
            <br />
            in the pine valleys
            <br />
            <span className="italic text-white/90">of Kashmir</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/80 text-pretty">
            Three bedrooms. One estate. Panoramic Himalayan ridgelines, a private chef,
            and the quiet of the high pines — yours alone.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={() => openBooking()}
              className="group inline-flex items-center justify-center gap-2 rounded-md bg-white px-7 py-3.5 text-sm font-medium tracking-wide text-primary transition-all hover:bg-accent hover:text-primary-foreground shadow-sm cursor-pointer"
            >
              Check availability
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <Link
              href="#suites"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/40 bg-white/5 px-7 py-3.5 text-sm font-medium tracking-wide text-white backdrop-blur-md transition-colors hover:bg-white/15"
            >
              Explore the villa
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Quick facts bar */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
        className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/15 bg-black/30 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-7xl items-center divide-x divide-white/15 px-5 sm:px-8">
          <Fact icon={<Users className="h-4 w-4" />} label={`Up to ${villaInfo.maxGuests} guests`} />
          <Fact icon={<BedDouble className="h-4 w-4" />} label={`${villaInfo.bedrooms} private suites`} />
          <Fact icon={<CalendarCheck className="h-4 w-4" />} label="Private chef & concierge" />
          <div className="hidden flex-1 px-6 py-4 text-right text-xs text-white/60 sm:block">
            Entire villa booked exclusively for one group
          </div>
        </div>
      </motion.div>

      {/* Floating booking widget */}
      <FloatingBookingWidget />
    </section>
  );
}

function Fact({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-1 items-center gap-2.5 px-6 py-4 text-white/85">
      <span className="text-accent">{icon}</span>
      <span className="text-xs font-medium tracking-wide">{label}</span>
    </div>
  );
}

function FloatingBookingWidget() {
  const reduce = useReducedMotion();
  const { openBooking } = useBooking();
  const [checkIn, setCheckIn] = useState('2026-09-10');
  const [checkOut, setCheckOut] = useState('2026-09-13');
  const [guests, setGuests] = useState('4');

  const handleFloatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openBooking({
      checkIn,
      checkOut,
      guestCount: parseInt(guests, 10) || 4,
    });
  };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 40 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.8 }}
      className="absolute right-5 top-24 z-20 hidden w-72 rounded-lg border border-white/20 bg-background/95 p-5 shadow-luxe-lg backdrop-blur-xl xl:block"
    >
      <p className="mb-4 text-xs font-medium uppercase tracking-luxe text-accent">
        Reserve your stay
      </p>
      <form onSubmit={handleFloatingSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Check-in</label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Check-out</label>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            min={checkIn || new Date().toISOString().split('T')[0]}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Guests</label>
          <select
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent"
          >
            <option value="1">1 guest</option>
            <option value="2">2 guests</option>
            <option value="4">4 guests</option>
            <option value="6">6 guests (max)</option>
          </select>
        </div>
        <button
          type="submit"
          className="mt-2 block w-full rounded-md bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-accent hover:text-primary-foreground cursor-pointer shadow-sm"
        >
          Check availability
        </button>
      </form>
    </motion.div>
  );
}
