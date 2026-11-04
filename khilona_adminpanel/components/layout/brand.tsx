import Image from 'next/image';
import { cn } from '@/utils/cn';

/** Official WM | WHITE MONKEY artwork (black on transparent) — the same file the storefront uses. */
const LOGO = { src: '/brand/white-monkey-logo.png', width: 949, height: 253 };

/**
 * The official logo. `inverted` turns the black artwork white for dark surfaces (sidebar, brand
 * panel). `monogram` crops to the "WM" mark for the collapsed sidebar rail.
 */
export function BrandLogo({ className, inverted, monogram }: { className?: string; inverted?: boolean; monogram?: boolean }) {
  return (
    <span
      className={cn(
        'relative block shrink-0 overflow-hidden',
        // the WM mark is the left ~42% of the artwork
        monogram ? 'aspect-[398/253] h-6' : 'aspect-[949/253] h-7',
        className,
      )}
    >
      <Image
        src={LOGO.src}
        alt="White Monkey Toys"
        width={LOGO.width}
        height={LOGO.height}
        priority
        className={cn(
          'absolute inset-y-0 left-0 h-full w-auto max-w-none select-none',
          inverted && 'brightness-0 invert',
        )}
        draggable={false}
      />
    </span>
  );
}

export function BrandMark({
  className,
  showAdmin = true,
  tone = 'light',
}: {
  className?: string;
  showAdmin?: boolean;
  /** `dark` renders the logo in white for dark surfaces (sidebar, brand panel). */
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <BrandLogo inverted={dark} />
      {showAdmin && (
        <span
          className={cn(
            'rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]',
            dark ? 'bg-white/10 text-white/70' : 'bg-stone-100 text-muted',
          )}
        >
          Admin
        </span>
      )}
    </span>
  );
}

export function FullScreenLoader({ label = 'Loading your workspace…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-page">
      <div className="animate-pop">
        <BrandMark />
      </div>
      <div className="h-1 w-44 overflow-hidden rounded-full bg-stone-200">
        <div className="h-full w-1/3 animate-[loader_1.1s_ease-in-out_infinite] rounded-full bg-ink" />
      </div>
      <p className="text-xs text-muted">{label}</p>
      <style>{`@keyframes loader{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
    </div>
  );
}
