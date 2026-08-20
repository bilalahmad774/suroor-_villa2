'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Router Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="font-serif text-3xl font-light text-foreground sm:text-4xl">Something went wrong</h2>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        An unexpected error occurred while loading this view. Please try again.
      </p>
      <Button
        onClick={() => reset()}
        className="mt-6 bg-primary text-primary-foreground hover:bg-accent hover:text-primary-foreground"
      >
        Try again
      </Button>
    </div>
  );
}
