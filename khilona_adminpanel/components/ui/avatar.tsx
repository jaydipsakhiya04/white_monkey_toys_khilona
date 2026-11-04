import { cn } from '@/utils/cn';

// quiet neutral tones (plus one accent tint) so customers stay distinguishable without a rainbow
const TINTS = [
  'bg-stone-100 text-stone-700',
  'bg-stone-200 text-stone-800',
  'bg-ink text-white',
  'bg-accent-tint text-accent-deep',
  'bg-stone-700 text-white',
  'bg-white text-ink ring-1 ring-inset ring-line-strong',
];

export function initialsOf(name: string | null | undefined): string {
  if (!name) return '?';
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || '?'
  );
}

/** Stable pastel tint per name. */
export function tintFor(name: string | null | undefined): string {
  let h = 0;
  for (const c of name ?? '') h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

/** Decorative initials avatar (the name is always rendered as text next to it). */
export function InitialsAvatar({ name, size = 32, className }: { name: string | null | undefined; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('flex shrink-0 items-center justify-center rounded-full font-semibold', tintFor(name), className)}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) }}
    >
      {initialsOf(name)}
    </span>
  );
}
