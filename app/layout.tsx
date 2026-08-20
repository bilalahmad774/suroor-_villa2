import './globals.css';
import type { Metadata } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { BookingProvider } from '@/context/BookingContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://suroorvilla.in'),
  title: {
    default: 'Suroor Villa — A Private Three-Bedroom Luxury Retreat in Kashmir',
    template: '%s | Suroor Villa Kashmir',
  },
  description:
    'Suroor Villa is an exclusive private three-bedroom luxury villa set amid the pine valleys of Kashmir. Experience curated stays, a dedicated private chef, heated pool, and panoramic Himalayan vistas.',
  keywords: [
    'Kashmir luxury villa',
    '3 bedroom villa Kashmir',
    'private villa booking Srinagar Gulmarg',
    'luxury vacation rental Kashmir',
    'Suroor Villa',
    'Tangmarg luxury homestay',
    'private estate Kashmir',
  ],
  authors: [{ name: 'Suroor Villa Estate' }],
  creator: 'Suroor Villa',
  publisher: 'Suroor Villa',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Suroor Villa — A Private Three-Bedroom Luxury Retreat in Kashmir',
    description:
      'An exclusive three-bedroom luxury villa in the pine valleys of Kashmir. Curated stays, private chef, heated pool, and panoramic Himalayan views.',
    url: 'https://suroorvilla.in',
    siteName: 'Suroor Villa Kashmir',
    type: 'website',
    locale: 'en_IN',
    images: [
      {
        url: '/images/exterior/exterior_(10).jpg',
        width: 1200,
        height: 630,
        alt: 'Suroor Villa nestled in the Kashmir mountain ridgeline',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Suroor Villa — Private Three-Bedroom Retreat in Kashmir',
    description:
      'An exclusive three-bedroom luxury villa in Kashmir with private chef and panoramic Himalayan views.',
    images: ['/images/exterior/exterior_(10).jpg'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LodgingBusiness',
  name: 'Suroor Villa',
  description:
    'A private three-bedroom luxury villa set amid the pine valleys of Kashmir with panoramic Himalayan views, private chef, and heated infinity pool.',
  url: 'https://suroorvilla.in',
  telephone: '+91-98765-43210',
  email: 'concierge@suroorvilla.in',
  image: 'https://suroorvilla.in/images/exterior/exterior_(10).jpg',
  priceRange: '₹₹₹₹',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Gulmarg Road, Pine Ridge',
    addressLocality: 'Tangmarg',
    addressRegion: 'Jammu & Kashmir',
    postalCode: '193111',
    addressCountry: 'IN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: '34.0583',
    longitude: '74.4262',
  },
  checkinTime: '14:00',
  checkoutTime: '11:00',
  numberOfRooms: 3,
  petsAllowed: 'False',
  amenityFeature: [
    { '@type': 'LocationFeatureSpecification', name: 'Private Chef & Kashmiri Kitchen', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Heated Infinity Pool', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Wood-fired Hearth', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'High-Speed Wi-Fi', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Airport Transfer Concierge', value: true },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${cormorant.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased selection:bg-accent/20 selection:text-foreground">
        <script
          id="structured-data-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <BookingProvider>
          {children}
          <Toaster />
        </BookingProvider>
      </body>
    </html>
  );
}
