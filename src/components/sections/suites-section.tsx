'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { ArrowRight, X, BedDouble, Bath, Users, Eye, Mountain, Sparkles, Home } from 'lucide-react';
import { rooms } from '@/config/content';
import { getCategoryGallery, getHeroImage, type ImageCategoryKey } from '@/config/imageConfig';
import type { Room } from '@/types/domain';
import { useBooking } from '@/context/BookingContext';
import { usePricing } from '@/hooks/usePricing';

const roomImageMap: Record<string, ImageCategoryKey> = {
  'room-1': 'bedroom1',
  'room-2': 'bedroom2',
  'room-3': 'bedroom3',
};

export function SuitesSection() {
  const [selected, setSelected] = useState<Room | null>(null);
  const { openBooking } = useBooking();
  const { entireVillaPrice, roomPrice, getRoomPrice, isLoading } = usePricing();
  const heroExterior = getHeroImage('exterior');

  return (
    <section id="suites" className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Accommodations & Buyouts"
          title="Reserve the Entire Villa or Individual Suites"
          description="Choose the exclusive 3-suite estate buyout for your group, or reserve one of our 3 individually appointed private Himalayan suites."
        />

        {/* FULL VILLA RESERVATION FEATURE CARD */}
        <Reveal delay={0.05}>
          <div className="mt-12 overflow-hidden rounded-xl border-2 border-accent/40 bg-gradient-to-br from-card via-card to-accent/5 shadow-luxe transition-all hover:border-accent/70">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="relative min-h-[260px] lg:col-span-5 lg:min-h-full">
                <Image
                  src={heroExterior.src}
                  alt="Suroor Villa Exclusive Estate"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 lg:bg-gradient-to-r lg:from-transparent lg:to-card" />
                <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1 text-xs font-semibold tracking-wide text-accent-foreground shadow-md">
                  <Sparkles className="h-3.5 w-3.5" />
                  Exclusive Private Buyout
                </div>
              </div>

              <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-7 lg:p-10">
                <div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                    <div>
                      <h3 className="font-serif text-3xl font-bold text-foreground">
                        Reserve Entire Villa
                      </h3>
                      <p className="text-xs font-medium uppercase tracking-luxe text-accent">
                        3 Private Suites • Up to 6 Guests • Full Private Estate
                      </p>
                    </div>
                    <div className="mt-2 text-left sm:mt-0 sm:text-right">
                      <div className="flex items-baseline gap-1">
                        <span className="font-serif text-3xl font-bold text-primary">
                          {entireVillaPrice !== null ? (
                            `₹${entireVillaPrice.toLocaleString('en-IN')}`
                          ) : isLoading ? (
                            <span className="text-lg animate-pulse text-muted-foreground">Loading...</span>
                          ) : (
                            'Rate on request'
                          )}
                        </span>
                        {entireVillaPrice !== null && (
                          <span className="text-xs text-muted-foreground">/ night</span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground block">
                        (Flat rate for all 3 suites • Entire estate yours alone)
                      </span>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Experience complete seclusion and intimacy. Renting the entire villa reserves all 3 private suites (The Master Suite, The Pine Suite, and The Garden Room), dedicated Kashmiri chef, private living salons, outdoor firepit, and landscaped pine valley grounds solely for your party.
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-y border-border/60 py-4">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-accent shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Estate</div>
                        <div className="text-xs font-semibold text-foreground">3 Suites (Full Villa)</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-accent shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Capacity</div>
                        <div className="text-xs font-semibold text-foreground">Up to 6 Guests</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-accent shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Beds</div>
                        <div className="text-xs font-semibold text-foreground">3 King / Twin Suites</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bath className="h-4 w-4 text-accent shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Baths</div>
                        <div className="text-xs font-semibold text-foreground">3 En-Suite Baths</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs text-muted-foreground">
                    {entireVillaPrice !== null ? (
                      <>
                        Special flat buyout price: <strong className="text-foreground">₹{entireVillaPrice.toLocaleString('en-IN')} / night</strong> (not charged per room).
                      </>
                    ) : (
                      'Flat estate buyout rate'
                    )}
                  </span>
                  <button
                    onClick={() => openBooking({ roomId: 'entire-villa' })}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-sm font-semibold tracking-wide text-primary-foreground shadow-md transition-all hover:bg-accent hover:text-accent-foreground cursor-pointer shrink-0"
                  >
                    Reserve Entire Villa
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* INDIVIDUAL SUITES HEADING */}
        <div className="mt-20">
          <div className="mb-8">
            <h3 className="font-serif text-2xl font-semibold text-foreground">
              Or Choose an Individual Suite
            </h3>
            <p className="text-xs text-muted-foreground">
              {roomPrice !== null ? (
                <>
                  Standard rate: <strong className="text-foreground">₹{roomPrice.toLocaleString('en-IN')} / night</strong> per individual suite.
                </>
              ) : isLoading ? (
                <span className="animate-pulse">Loading rates from database...</span>
              ) : (
                'Select a suite below to check rates.'
              )}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 lg:gap-8">
            {rooms.map((room, i) => {
              const category = roomImageMap[room.id];
              const gallery = getCategoryGallery(category);
              const hero = gallery[0];
              const price = getRoomPrice(room.id);

              return (
                <Reveal key={room.id} delay={i * 0.08}>
                  <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm transition-all hover:shadow-luxe hover:border-accent/40">
                    <div className="relative aspect-[16/11] overflow-hidden">
                      <Image
                        src={hero.src}
                        alt={hero.alt}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <span className="absolute left-3 top-3 rounded-full bg-background/95 px-3 py-1 text-xs font-semibold tracking-wide text-primary backdrop-blur-md shadow-sm">
                        Suite {i + 1}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-serif text-xl font-bold text-foreground">
                          {room.name}
                        </h4>
                        <p className="shrink-0 text-right">
                          <span className="font-serif text-lg font-bold text-primary">
                            {price !== null ? (
                              `₹${price.toLocaleString('en-IN')}`
                            ) : isLoading ? (
                              <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>
                            ) : (
                              'Contact for rate'
                            )}
                          </span>
                          {price !== null && (
                            <span className="block text-[11px] text-muted-foreground">/ night</span>
                          )}
                        </p>
                      </div>

                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                        {room.description}
                      </p>

                      {/* Room specs */}
                      <div className="mt-4 grid grid-cols-3 gap-2 border-y border-border/60 py-3">
                        <Spec icon={<BedDouble className="h-3.5 w-3.5" />} label="Bed" value={room.bedType} />
                        <Spec icon={<Users className="h-3.5 w-3.5" />} label="Sleeps" value={`${room.capacity}`} />
                        <Spec icon={<Bath className="h-3.5 w-3.5" />} label="Bath" value="En-suite" />
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                        <button
                          onClick={() => setSelected(room)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Details
                        </button>
                        <button
                          onClick={() => openBooking({ roomId: room.id })}
                          className="group/link inline-flex items-center gap-1.5 rounded-md bg-primary/10 hover:bg-primary hover:text-primary-foreground px-3.5 py-1.5 text-xs font-semibold text-primary transition-all cursor-pointer"
                        >
                          Reserve Suite
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <RoomDetailModal
          room={selected}
          price={getRoomPrice(selected.id)}
          isLoading={isLoading}
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
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <span className="text-accent">{icon}</span>
        {label}
      </span>
      <span className="text-xs font-medium text-foreground truncate">{value}</span>
    </div>
  );
}

function RoomDetailModal({
  room,
  price,
  isLoading,
  images,
  onClose,
  onReserve,
}: {
  room: Room;
  price: number | null;
  isLoading?: boolean;
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
              <span className="font-serif text-2xl font-bold text-primary">
                {price !== null ? (
                  `₹${price.toLocaleString('en-IN')}`
                ) : isLoading ? (
                  <span className="text-sm text-muted-foreground animate-pulse">Loading...</span>
                ) : (
                  'Contact for rate'
                )}
              </span>
              {price !== null && (
                <span className="block text-xs text-muted-foreground">/ night</span>
              )}
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
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent hover:text-primary-foreground cursor-pointer"
            >
              Reserve this suite {price !== null ? `(₹${price.toLocaleString('en-IN')}/night)` : ''}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-md border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary cursor-pointer"
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
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="text-accent">{icon}</span>
        {label}
      </span>
      <span className="text-xs font-medium text-foreground">{value}</span>
    </div>
  );
}
