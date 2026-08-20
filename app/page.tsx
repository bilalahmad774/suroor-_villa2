import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { HeroSection } from '@/components/sections/hero-section';
import { StorySection } from '@/components/sections/story-section';
import { SuitesSection } from '@/components/sections/suites-section';
import { AmenitiesSection } from '@/components/sections/amenities-section';
import { GallerySection } from '@/components/sections/gallery-section';
import { AttractionsSection } from '@/components/sections/attractions-section';
import { ReviewsSection } from '@/components/sections/reviews-section';
import { BookingSection } from '@/components/sections/booking-section';
import { CtaSection } from '@/components/sections/cta-section';

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <StorySection />
        <SuitesSection />
        <AmenitiesSection />
        <GallerySection />
        <BookingSection />
        <AttractionsSection />
        <ReviewsSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
