import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Estate Management Portal',
  description: 'Administrative portal for Suroor Villa reservations, rates, audit logs, and calendar controls.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
