'use client';

import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { Star, Quote } from 'lucide-react';
import { reviews } from '@/config/content';

export function ReviewsSection() {
  return (
    <section id="reviews" className="bg-primary py-24 text-primary-foreground lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Guest Stories"
          title={
            <span className="text-primary-foreground">
              Loved by those who have stayed
            </span>
          }
          description="A few words from guests who have made Suroor Villa their own."
          className="[&_p]:text-primary-foreground/70"
        />

        <div className="mt-16 grid gap-6 md:grid-cols-3 lg:gap-8">
          {reviews.map((review, i) => (
            <Reveal key={review.name} delay={i * 0.1}>
              <figure className="flex h-full flex-col rounded-sm border border-primary-foreground/15 bg-primary-foreground/5 p-7 backdrop-blur-sm">
                <Quote className="h-7 w-7 text-accent" />
                <div className="mt-4 flex gap-0.5">
                  {Array.from({ length: review.rating }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <h3 className="mt-4 font-serif text-xl font-medium text-primary-foreground">
                  {review.title}
                </h3>
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-primary-foreground/75 text-pretty">
                  “{review.body}”
                </blockquote>
                <figcaption className="mt-6 border-t border-primary-foreground/15 pt-4">
                  <p className="text-sm font-medium text-primary-foreground">
                    {review.name}
                  </p>
                  <p className="text-xs text-primary-foreground/60">{review.location}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
