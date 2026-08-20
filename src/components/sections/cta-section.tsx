'use client';

import Image from 'next/image';
import { Reveal } from '@/components/ui/reveal';
import { ArrowRight } from 'lucide-react';
import { getHeroImage } from '@/config/imageConfig';
import { useBooking } from '@/context/BookingContext';
import { siteConfig } from '@/config/siteConfig';

export function CtaSection() {
  const hero = getHeroImage('exterior');
  const { openBooking } = useBooking();

  return (
    <section id="reserve-cta" className="relative overflow-hidden py-28 lg:py-40">
      <div className="absolute inset-0">
        <Image
          src={hero.src}
          alt={hero.alt}
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/75 to-primary/90" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-5 text-center sm:px-8">
        <Reveal>
          <p className="mb-4 text-xs font-medium uppercase tracking-luxe text-accent">
            Reserve your stay
          </p>
          <h2 className="font-serif text-4xl font-light leading-tight text-primary-foreground sm:text-5xl lg:text-6xl">
            Your week in the pines
            <br />
            awaits
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-primary-foreground/80 text-pretty">
            Suroor Villa is booked as a single private estate for groups of up to six.
            Tell us your dates and we will prepare a tailored proposal.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => openBooking()}
              className="group inline-flex items-center justify-center gap-2 rounded-md bg-accent px-8 py-3.5 text-sm font-medium tracking-wide text-primary-foreground transition-all hover:bg-accent/90 cursor-pointer shadow-md"
            >
              Check availability
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <a
              href={siteConfig.emailHref}
              className="inline-flex items-center justify-center rounded-md border border-primary-foreground/30 px-8 py-3.5 text-sm font-medium tracking-wide text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              Speak to the concierge
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
