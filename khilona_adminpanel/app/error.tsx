'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { BrandMark } from '@/components/layout/brand';
import { Button } from '@/components/ui/button';

export default function GlobalRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div role="alert" className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-page px-6 text-center">
      <BrandMark />
      <div className="flex size-14 items-center justify-center rounded-2xl border border-red-200 bg-danger-tint text-danger shadow-raised">
        <AlertTriangle className="size-6" aria-hidden />
      </div>
      <div>
        <h1 className="font-display text-2xl font-bold tracking-[-0.02em]">Something went wrong</h1>
        <p className="mt-2 max-w-sm text-sm text-muted">An unexpected error occurred. Try again, or reload the page if it keeps happening.</p>
        {error.digest && <p className="mt-2 text-xs text-stone-400 tabular">Reference: {error.digest}</p>}
      </div>
      <div className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="secondary" onClick={() => window.location.assign('/')}>
          Go to dashboard
        </Button>
      </div>
    </div>
  );
}
