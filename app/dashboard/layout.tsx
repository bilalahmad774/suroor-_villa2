import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guest Dashboard & Reservations',
  description: 'Manage your Suroor Villa reservations, download GST tax invoices, review stay details, and manage cancellations.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
