import Link from 'next/link';
import { BrandMark } from '@/components/layout/brand';
import { buttonClasses } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-page px-6 text-center">
      <BrandMark />
      <div className="animate-enter">
        <p className="bg-gradient-to-b from-[#FF8A55] to-brand bg-clip-text font-display text-7xl font-extrabold tracking-[-0.04em] text-transparent tabular">
          404
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em]">Page not found</h1>
        <p className="mt-2 max-w-sm text-sm text-muted">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      </div>
      <div className="flex gap-2">
        <Link href="/" className={buttonClasses()}>
          Go to dashboard
        </Link>
        <Link href="/orders" className={buttonClasses({ variant: 'secondary' })}>
          View orders
        </Link>
      </div>
    </div>
  );
}
