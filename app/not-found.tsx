import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="font-serif text-5xl font-light text-foreground sm:text-6xl">404</h1>
      <p className="mt-4 text-lg font-medium text-foreground">Page not found</p>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        The sanctuary page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent hover:text-primary-foreground"
      >
        Return to Suroor Villa
      </Link>
    </div>
  );
}
