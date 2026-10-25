import { useId } from 'react';
import { cn } from '@/utils/cn';

/** The White Monkey Toys "WM" monogram: white W + tangerine M on a midnight tile. */
export function BrandLogo({ size = 30, className }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden
      className={cn('shrink-0 drop-shadow-[0_3px_8px_rgb(12_13_22/0.35)]', className)}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#23263A" />
          <stop offset="1" stopColor="#0C0D16" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8.5" fill={`url(#${id})`} />
      <rect x="0.5" y="0.5" width="31" height="31" rx="8" fill="none" stroke="#fff" strokeOpacity="0.12" />
      <g fill="none" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.7 10.6 7.35 21.4 10.05 14.3 12.75 21.4 15.4 10.6" stroke="#fff" />
        <path d="M17 21.4V10.6l5.2 7 5.2-7v10.8" stroke="#FF5A1F" />
      </g>
    </svg>
  );
}

export function BrandMark({
  className,
  showAdmin = true,
  tone = 'light',
}: {
  className?: string;
  showAdmin?: boolean;
  /** `dark` renders light text for dark surfaces (sidebar, brand panel). */
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';
  return (
    <span className={cn('inline-flex items-center', className)}>
      <BrandLogo />
      <span aria-hidden className={cn('mx-2.5 h-7 w-px', dark ? 'bg-white/20' : 'bg-ink/15')} />
      <span className="flex flex-col leading-none">
        <span className="sr-only">White Monkey Toys</span>
        <span aria-hidden className={cn('font-display text-[14px] font-extrabold uppercase tracking-[0.08em]', dark ? 'text-white' : 'text-ink')}>
          White Monkey
        </span>
        {showAdmin && (
          <span
            className={cn(
              'mt-1 text-[10px] font-semibold uppercase tracking-[0.16em]',
              dark ? 'text-white/45' : 'text-muted',
            )}
          >
            Admin console
          </span>
        )}
      </span>
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
        <div className="h-full w-1/3 animate-[loader_1.1s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-[#FF7A3D] to-brand" />
      </div>
      <p className="text-xs text-muted">{label}</p>
      <style>{`@keyframes loader{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
    </div>
  );
}
