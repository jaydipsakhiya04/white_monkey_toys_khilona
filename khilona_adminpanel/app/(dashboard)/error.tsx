'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { Button, buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/feedback';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <Card role="alert" className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 flex size-11 items-center justify-center rounded-xl border border-red-200 bg-danger-tint text-danger">
        <AlertTriangle className="size-5" aria-hidden />
      </div>
      <h1 className="text-base font-semibold">This page ran into a problem</h1>
      <p className="mt-1 max-w-sm text-[13px] text-muted">Your data is safe. Try again, or go back to the dashboard.</p>
      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={reset}>
          Try again
        </Button>
        <Link href="/" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
          Dashboard
        </Link>
      </div>
    </Card>
  );
}
