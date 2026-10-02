import Link from "next/link";
import { SmartImage } from "@/components/ui/smart-image";
import { cn } from "@/utils/cn";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline font-display text-[1.6rem] font-extrabold leading-none tracking-[-0.04em] text-ink", className)}>
      KHILONA
      <span className="ml-0.5 inline-block size-2 translate-y-[-0.05em] rounded-full bg-coral" aria-hidden="true" />
    </span>
  );
}

export function Logo({ name, logoUrl, className }: { name: string; logoUrl: string | null; className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex shrink-0 items-center rounded-lg", className)} aria-label={`${name} – home`}>
      {logoUrl ? (
        <span className="relative block h-9 w-28 sm:h-10 sm:w-32">
          <SmartImage src={logoUrl} alt={name} fill sizes="128px" className="object-contain object-left" priority />
        </span>
      ) : (
        <Wordmark />
      )}
    </Link>
  );
}
