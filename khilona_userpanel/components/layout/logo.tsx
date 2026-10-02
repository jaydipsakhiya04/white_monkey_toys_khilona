import Link from "next/link";
import type { SVGProps } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/utils/cn";

/**
 * Minimal brand mark: a geometric monkey face — black head and ears, a white face.
 * Drawn on a 32×32 grid so it stays crisp from favicon size up.
 */
export function MonkeyMark({ className, face = "#fff", ...props }: SVGProps<SVGSVGElement> & { face?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("shrink-0", className)} {...props}>
      <circle cx="5.6" cy="15" r="4.6" fill="currentColor" />
      <circle cx="26.4" cy="15" r="4.6" fill="currentColor" />
      <circle cx="16" cy="16" r="12" fill="currentColor" />
      <path
        d="M16 12.1c1-.95 2.2-1.45 3.55-1.45 2.55 0 4.25 1.85 4.25 4.25 0 .95-.27 1.8-.72 2.5.5.6.8 1.37.8 2.22 0 3.05-3.3 5.35-7.88 5.35s-7.88-2.3-7.88-5.35c0-.85.3-1.62.8-2.22a4.6 4.6 0 0 1-.72-2.5c0-2.4 1.7-4.25 4.25-4.25 1.35 0 2.55.5 3.55 1.45Z"
        fill={face}
      />
      <circle cx="12.7" cy="15.1" r="1.25" fill="currentColor" />
      <circle cx="19.3" cy="15.1" r="1.25" fill="currentColor" />
      <path d="M13.6 20.4c1.4 1.05 3.4 1.05 4.8 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Black uppercase wordmark with the monkey mark. `name` comes from the store settings. */
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
  /** white wordmark for dark backgrounds */
  inverted?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", inverted ? "text-white" : "text-ink", className)}>
      <MonkeyMark className={cn("size-6 min-[360px]:size-7 sm:size-8", markClassName)} face={inverted ? "#0a0a0a" : "#fff"} />
      <span
        className={cn(
          "font-display font-extrabold uppercase leading-none tracking-[0.09em]",
          compact ? "text-[0.875rem]" : "text-[0.8rem] min-[360px]:text-[0.9rem] xs:text-[0.98rem] sm:text-[1.08rem]",
        )}
      >
        {name}
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
