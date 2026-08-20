'use client';

import Image from 'next/image';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { amenities } from '@/config/content';
import { getIcon } from '@/lib/icons';
import { getHeroImage, getCategoryGallery } from '@/config/imageConfig';

export function AmenitiesSection() {
  const poolHero = getHeroImage('amenities');
  const diningImgs = getCategoryGallery('dining');
  const diningImg = diningImgs[0];
  const diningImg2 = diningImgs[1] ?? diningImgs[0];

  return (
    <section id="amenities" className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Amenities"
          title="Everything considered, nothing wanting"
          description="Suroor Villa is run as a full-service private estate. A chef, a concierge, and a quiet team operate behind the scenes so your group can simply be."
        />

        <div className="mt-16 grid gap-10 lg:grid-cols-3 lg:gap-8">
          {/* Feature image */}
          <Reveal className="lg:col-span-1">
            <div className="relative aspect-[3/4] overflow-hidden rounded-sm">
              <Image
                src={poolHero.src}
                alt={poolHero.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6">
                <p className="font-serif text-2xl text-white">{poolHero.caption}</p>
              </div>
            </div>
          </Reveal>

          {/* Amenities grid + two small images */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-5">
              {amenities.map((a, i) => {
                const Icon = getIcon(a.icon);
                return (
                  <Reveal key={a.label} delay={i * 0.05}>
                    <div className="group flex h-full flex-col items-start gap-3 rounded-sm border border-border/60 bg-card p-5 transition-colors hover:border-accent/50">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary transition-colors group-hover:bg-accent group-hover:text-primary-foreground">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-medium leading-snug text-foreground">
                        {a.label}
                      </span>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:gap-5">
              <Reveal delay={0.1}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                  <Image
                    src={diningImg.src}
                    alt={diningImg.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                  <Image
                    src={diningImg2.src}
                    alt={diningImg2.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
