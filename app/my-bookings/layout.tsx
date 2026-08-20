import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Reservations & Booking History',
  description: 'View your confirmed bookings, payment status, and download tax invoices for your Suroor Villa stay.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function MyBookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
