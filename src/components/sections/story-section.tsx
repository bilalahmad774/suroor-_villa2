'use client';

import Image from 'next/image';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { getHeroImage, getCategoryGallery } from '@/config/imageConfig';
import { villaInfo } from '@/config/content';

export function StorySection() {
  const exterior = getHeroImage('exterior');
  const livingRoom = getCategoryGallery('livingRoom')[1];

  return (
    <section id="villa" className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Images */}
          <Reveal className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm">
              <Image
                src={exterior.src}
                alt={exterior.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-10 -right-4 hidden aspect-[4/3] w-56 overflow-hidden rounded-sm border-8 border-background shadow-luxe sm:block lg:w-72">
              <Image
                src={livingRoom.src}
                alt={livingRoom.alt}
                fill
                sizes="288px"
                className="object-cover"
              />
            </div>
          </Reveal>

          {/* Copy */}
          <div>
            <SectionHeading
              align="left"
              eyebrow="The Villa"
              title={
                <>
                  Built from local stone,
                  <br />
                  shaped by the ridge
                </>
              }
            />
            <Reveal delay={0.1}>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground text-pretty">
                {villaInfo.description}
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <dl className="mt-10 grid grid-cols-3 gap-6 border-y border-border/60 py-8">
                <Stat value="3" label="Private suites" />
                <Stat value="6" label="Guests maximum" />
                <Stat value="1" label="Estate, yours alone" />
              </dl>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="font-serif text-4xl font-light text-primary">{value}</dt>
      <dd className="mt-1 text-xs uppercase tracking-wide-luxe text-muted-foreground">
        {label}
      </dd>
    </div>
  );
}
