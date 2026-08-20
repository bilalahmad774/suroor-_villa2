'use client';

import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { BedDouble, Users, Bath, Home, MapPin, LogIn, LogOut, Moon } from 'lucide-react';
import { villaDetails, villaInfo } from '@/config/content';

const iconMap: Record<string, React.ReactNode> = {
  'Bedrooms': <BedDouble className="h-5 w-5" />,
  'Guest capacity': <Users className="h-5 w-5" />,
  'Bathrooms': <Bath className="h-5 w-5" />,
  'Property type': <Home className="h-5 w-5" />,
  'Location': <MapPin className="h-5 w-5" />,
  'Check-in': <LogIn className="h-5 w-5" />,
  'Check-out': <LogOut className="h-5 w-5" />,
  'Minimum stay': <Moon className="h-5 w-5" />,
};

export function VillaDetailsSection() {
  return (
    <section id="details" className="bg-secondary/40 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="The Estate"
          title="At a glance"
          description="Everything you need to know before you arrive — all three suites, one private estate."
        />

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-sm border border-border/60 bg-border/60 sm:grid-cols-4">
          {villaDetails.map((detail, i) => (
            <Reveal key={detail.label} delay={i * 0.04}>
              <div className="flex h-full flex-col items-start gap-3 bg-card p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary">
                  {iconMap[detail.label] ?? <Home className="h-5 w-5" />}
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wide-luxe text-muted-foreground">
                    {detail.label}
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {detail.value}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground text-pretty">
            {villaInfo.name} is rented as a single private estate for groups of up to{' '}
            {villaInfo.maxGuests}. All {villaInfo.bedrooms} suites are included in every booking.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
