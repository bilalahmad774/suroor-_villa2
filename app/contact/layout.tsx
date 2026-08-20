import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact & Concierge Desk',
  description: 'Reach the Suroor Villa concierge desk for custom bookings, private dining requests, luxury airport transfers, and bespoke Kashmir itineraries.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact Concierge Desk | Suroor Villa Kashmir',
    description: 'Reach the Suroor Villa concierge desk for private villa reservations, airport transfers, and Kashmiri dining.',
    url: 'https://suroorvilla.in/contact',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
