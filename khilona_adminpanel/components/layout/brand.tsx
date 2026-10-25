import { useId } from 'react';
import { cn } from '@/utils/cn';

/** The White Monkey Toys logo tile (tangerine square with a monkey face). */
export function BrandLogo({ size = 28, className }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden
      className={cn('shrink-0 drop-shadow-[0_2px_6px_rgb(240_90_34/0.35)]', className)}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF7A3D" />
          <stop offset="1" stopColor="#E2470F" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id})`} />
      <g transform="translate(4 4)">
        <circle cx="5" cy="12" r="3.2" fill="#fff" />
        <circle cx="19" cy="12" r="3.2" fill="#fff" />
        <circle cx="12" cy="12" r="7" fill="#fff" />
        <circle cx="9.6" cy="10.6" r="2.5" fill="#FFE0D1" />
        <circle cx="14.4" cy="10.6" r="2.5" fill="#FFE0D1" />
        <ellipse cx="12" cy="14.4" rx="4.6" ry="3.3" fill="#FFE0D1" />
        <circle cx="9.8" cy="10.9" r="0.95" fill="#0F1115" />
        <circle cx="14.2" cy="10.9" r="0.95" fill="#0F1115" />
        <path d="M10.2 15.1q1.8 1.4 3.6 0" fill="none" stroke="#0F1115" strokeWidth="1.1" strokeLinecap="round" />
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
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <BrandLogo />
      <span className="flex flex-col leading-none">
        <span className={cn('font-display text-[15px] font-bold tracking-[-0.01em]', dark ? 'text-white' : 'text-ink')}>
          White Monkey Toys
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
