'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { X } from 'lucide-react';
import { getCategoryGallery } from '@/config/imageConfig';
import { cn } from '@/lib/utils';

export function GallerySection() {
  const gallery = getCategoryGallery('gallery');
  const [active, setActive] = useState<number | null>(null);

  return (
    <section id="gallery" className="bg-secondary/40 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Gallery"
          title="A walk through Suroor Villa"
          description="From the ridge at golden hour to the hearth at dusk — a closer look at the villa and its grounds."
        />

        <div className="mt-16 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {gallery.map((img, i) => {
            // Make the first image span 2 columns/rows for visual rhythm.
            const feature = i === 0;
            return (
              <Reveal
                key={img.src}
                delay={(i % 4) * 0.06}
                className={cn(
                  feature && 'col-span-2 row-span-2 md:col-span-2 md:row-span-2'
                )}
              >
                <button
                  onClick={() => setActive(i)}
                  className="group relative block h-full w-full overflow-hidden rounded-sm"
                  aria-label={`Open image: ${img.alt}`}
                >
                  <div className={cn('relative', feature ? 'aspect-square' : 'aspect-[4/3]')}>
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes={
                        feature
                          ? '(max-width: 768px) 100vw, 50vw'
                          : '(max-width: 768px) 50vw, 25vw'
                      }
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* Lightbox */}
      {active !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <button
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative aspect-[16/10] w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image
              src={gallery[active].src}
              alt={gallery[active].alt}
              fill
              sizes="100vw"
              className="object-contain"
            />
            {gallery[active].caption && (
              <p className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-center text-sm text-white/90">
                {gallery[active].caption}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
