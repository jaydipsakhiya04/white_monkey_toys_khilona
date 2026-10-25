import Link from "next/link";
import type { SVGProps } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/utils/cn";

/**
 * "WM" monogram: a white W and a tangerine M drawn as rounded strokes on a midnight tile
 * (32×32 grid, crisp from favicon size up). `inverted` uses a white tile for dark backgrounds.
 */
export function WmMark({ className, inverted, ...props }: SVGProps<SVGSVGElement> & { inverted?: boolean }) {
  // fixed ids: every instance defines the same gradient, so duplicates are harmless (works in server components)
  const id = inverted ? "wm-tile-inverted" : "wm-tile";
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("shrink-0", className)} {...props}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={inverted ? "#ffffff" : "#23263a"} />
          <stop offset="1" stopColor={inverted ? "#ece8e1" : "#0c0d16"} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8.5" fill={`url(#${id})`} />
      <g fill="none" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.7 10.6 7.35 21.4 10.05 14.3 12.75 21.4 15.4 10.6" stroke={inverted ? "#0c0d16" : "#ffffff"} />
        <path d="M17 21.4V10.6l5.2 7 5.2-7v10.8" stroke="#ff5a1f" />
      </g>
    </svg>
  );
}

/** Splits "White Monkey Toys" into the main line ("White Monkey") and the small tag ("Toys"). */
function splitName(name: string) {
  const m = name.trim().match(/^(.*?)\s+(toys?)$/i);
  return m ? { main: m[1], tag: m[2] } : { main: name.trim(), tag: "" };
}

/** WM | WHITE MONKEY lockup. `name` comes from the store settings. */
export function Wordmark({
  name = BRAND_NAME,
  className,
  markClassName,
  compact,
  inverted,
}: {
  name?: string;
  className?: string;
  markClassName?: string;
  compact?: boolean;
  /** light lockup for dark backgrounds */
  inverted?: boolean;
}) {
  const { main, tag } = splitName(name);
  return (
    <span className={cn("inline-flex items-center", inverted ? "text-white" : "text-ink", className)}>
      <WmMark inverted={inverted} className={cn("size-8 sm:size-9", markClassName)} />
      <span aria-hidden="true" className={cn("mx-2.5 h-7 w-px sm:mx-3", inverted ? "bg-white/25" : "bg-ink/20")} />
      <span className="flex flex-col justify-center leading-none">
        <span
          className={cn(
            "font-display font-extrabold uppercase tracking-[0.08em]",
            compact ? "text-[0.875rem]" : "text-[0.84rem] min-[360px]:text-[0.92rem] sm:text-[1.05rem]",
          )}
        >
          {main}
        </span>
        {tag && (
          <span className="mt-[3px] text-[0.5625rem] font-bold uppercase tracking-[0.42em] text-accent-deep sm:text-[0.625rem]">
            <span className={inverted ? "text-accent" : undefined}>{tag}</span>
          </span>
        )}
      </span>
    </span>
  );
}

export function Logo({ name, logoUrl, className }: { name: string; logoUrl: string | null; className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex shrink-0 items-center rounded-lg", className)} aria-label={`${name} – home`}>
      {logoUrl ? (
        <span className="relative block h-9 w-32 sm:h-10 sm:w-40">
          <SmartImage src={logoUrl} alt={name} fill sizes="160px" className="object-contain object-left" priority />
        </span>
      ) : (
        <Wordmark name={name} />
      )}
    </Link>
  );
}
