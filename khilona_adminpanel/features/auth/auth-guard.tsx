'use client';

import { WifiOff } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { BrandMark, FullScreenLoader } from '@/components/layout/brand';
import { Button } from '@/components/ui/button';
import { useAuth } from './auth-provider';

export function OfflineScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-page px-6 text-center">
      <BrandMark />
      <div className="mt-4 flex size-12 items-center justify-center rounded-xl border border-line bg-surface text-muted">
        <WifiOff className="size-5" aria-hidden />
      </div>
      <div>
        <h1 className="text-base font-semibold">Can&apos;t reach the server</h1>
        <p className="mt-1 max-w-sm text-sm text-muted">
          The KHILONA API is not responding. Check that the backend is running and try again.
        </p>
      </div>
      <Button onClick={onRetry}>Try again</Button>
    </div>
  );
}

/** Client-side guard for the protected route group. */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { status, retry } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      const search = window.location.search;
      const next = pathname && pathname !== '/' ? `?next=${encodeURIComponent(pathname + search)}` : '';
      router.replace(`/login${next}`);
    }
  }, [status, pathname, router]);

  if (status === 'offline') return <OfflineScreen onRetry={retry} />;
  if (status !== 'authenticated')
    return (
      <FullScreenLoader
        label={status === 'loading' ? 'Restoring your session…' : status === 'signedOut' ? 'Signing out…' : 'Redirecting to sign in…'}
      />
    );
  return <>{children}</>;
}
