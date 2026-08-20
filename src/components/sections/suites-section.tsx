'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { ArrowRight, X, BedDouble, Bath, Users, Eye, Mountain } from 'lucide-react';
import { rooms } from '@/config/content';
import { getCategoryGallery, type ImageCategoryKey } from '@/config/imageConfig';
import type { Room } from '@/types/domain';
import { cn } from '@/lib/utils';
import { useBooking } from '@/context/BookingContext';

const roomImageMap: Record<string, ImageCategoryKey> = {
  'room-1': 'bedroom1',
  'room-2': 'bedroom2',
  'room-3': 'bedroom3',
};

export function SuitesSection() {
  const [selected, setSelected] = useState<Room | null>(null);
  const { openBooking } = useBooking();

  return (
    <section id="suites" className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="The Suites"
          title="Three rooms, three characters"
          description="Each suite is individually designed — from the ridge-facing Master Suite to the peaceful Garden Room. All are booked together as one private estate."
        />

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:gap-10">
          {rooms.map((room, i) => {
            const category = roomImageMap[room.id];
            const gallery = getCategoryGallery(category);
            const hero = gallery[0];
            const secondary = gallery[1] ?? gallery[0];

            return (
              <Reveal key={room.id} delay={i * 0.08}>
                <article className="group flex h-full flex-col overflow-hidden rounded-sm border border-border/60 bg-card shadow-sm transition-all hover:shadow-luxe">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={hero.src}
                      alt={hero.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs font-medium tracking-wide text-primary backdrop-blur-md">
                      Suite {i + 1}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-6 lg:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-serif text-2xl font-medium text-foreground">
                        {room.name}
                      </h3>
                      <p className="shrink-0 text-right">
                        <span className="font-serif text-lg text-primary">
                          ₹{room.basePricePerNight.toLocaleString('en-IN')}
                        </span>
                        <span className="block text-xs text-muted-foreground">/ night</span>
                      </p>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
                      {room.description}
                    </p>

                    {/* Room specs */}
                    <div className="mt-5 grid grid-cols-3 gap-3 border-y border-border/60 py-4">
                      <Spec icon={<BedDouble className="h-4 w-4" />} label="Bed" value={room.bedType} />
                      <Spec icon={<Users className="h-4 w-4" />} label="Sleeps" value={`${room.capacity}`} />
                      <Spec icon={<Bath className="h-4 w-4" />} label="Bath" value="En-suite" />
                    </div>

                    <ul className="mt-5 flex flex-wrap gap-2">
                      {room.amenities.map((a) => (
                        <li
                          key={a}
                          className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground"
                        >
                          {a}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto flex items-center justify-between gap-4 pt-6">
                      <button
                        onClick={() => setSelected(room)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-accent"
                      >
                        <Eye className="h-4 w-4" />
                        View details
                      </button>
                      <button
                        onClick={() => openBooking({ roomId: room.id })}
                        className="group/link inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-accent cursor-pointer"
                      >
                        Reserve
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" />
                      </button>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <RoomDetailModal
          room={selected}
          images={getCategoryGallery(roomImageMap[selected.id])}
          onClose={() => setSelected(null)}
          onReserve={() => {
            const roomId = selected.id;
            setSelected(null);
            openBooking({ roomId });
          }}
        />
      )}
    </section>
  );
}

function Spec({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="text-accent">{icon}</span>
        {label}
      </span>
      <span className="text-xs font-medium text-foreground">{value}</span>
    </div>
  );
}

function RoomDetailModal({
  room,
  images,
  onClose,
  onReserve,
}: {
  room: Room;
  images: { src: string; alt: string; caption?: string }[];
  onClose: () => void;
  onReserve?: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${room.name} details`}
    >
      <button
        className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/10"
        aria-label="Close details"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </button>

      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-border/60 bg-background shadow-luxe-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image gallery */}
        <div className="grid gap-2 p-4 sm:grid-cols-2">
          {images.map((img) => (
            <div key={img.src} className="relative aspect-[4/3] overflow-hidden rounded-sm">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {/* Details */}
        <div className="p-6 lg:p-8">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-serif text-3xl font-medium text-foreground">{room.name}</h3>
            <p className="shrink-0 text-right">
              <span className="font-serif text-xl text-primary">
                ₹{room.basePricePerNight.toLocaleString('en-IN')}
              </span>
              <span className="block text-xs text-muted-foreground">/ night</span>
            </p>
          </div>

          <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">
            {room.description}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4 border-y border-border/60 py-6 sm:grid-cols-4">
            <DetailSpec icon={<BedDouble className="h-4 w-4" />} label="Bed type" value={room.bedType} />
            <DetailSpec icon={<Users className="h-4 w-4" />} label="Occupancy" value={`${room.capacity} guests`} />
            <DetailSpec icon={<Bath className="h-4 w-4" />} label="Bathroom" value={room.bathroom} />
            <DetailSpec icon={<Mountain className="h-4 w-4" />} label="View" value={room.view} />
          </div>

          <div className="mt-6">
            <h4 className="text-xs font-medium uppercase tracking-luxe text-accent">Amenities</h4>
            <ul className="mt-3 flex flex-wrap gap-2">
              {room.amenities.map((a) => (
                <li
                  key={a}
                  className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground"
                >
                  {a}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onReserve}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent hover:text-primary-foreground cursor-pointer"
            >
              Reserve this suite
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-md border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailSpec({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="text-accent">{icon}</span>
        {label}
      </span>
      <span className={cn('text-sm font-medium text-foreground')}>{value}</span>
    </div>
  );
}
