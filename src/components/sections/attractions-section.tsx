'use client';

import Image from 'next/image';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { MapPin } from 'lucide-react';
import { nearbyAttractions } from '@/config/content';
import { getCategoryGallery } from '@/config/imageConfig';

export function AttractionsSection() {
  const attractionImages = getCategoryGallery('nearbyAttractions');

  return (
    <section id="explore" className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Explore Kashmir"
          title="Beyond the villa gates"
          description="Suroor Villa is a short drive from the valleys, lakes, and high meadows that make Kashmir legendary. Your concierge can arrange guided days out."
        />

        <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-2 lg:gap-8">
          {nearbyAttractions.map((attr, i) => {
            const img = attractionImages[i] ?? attractionImages[0];
            return (
              <Reveal key={attr.name} delay={i * 0.08}>
                <article className="group h-full overflow-hidden rounded-sm border border-border/60 bg-card">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                      src={img.src}
                      alt={img.alt ?? attr.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <p className="flex items-center gap-1.5 text-xs text-white/70">
                        <MapPin className="h-3.5 w-3.5" />
                        {attr.distance} • {attr.travelTime}
                      </p>
                      <h3 className="mt-1 font-serif text-xl font-medium text-white">
                        {attr.name}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/80 text-pretty">
                        {attr.description}
                      </p>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
