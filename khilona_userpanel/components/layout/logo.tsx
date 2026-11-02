import Image from "next/image";
import Link from "next/link";
import { SmartImage } from "@/components/ui/smart-image";
import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/utils/cn";

/** Official WM | WHITE MONKEY artwork (black on transparent), bundled as a fallback for the store logo. */
export const BRAND_LOGO = { src: "/brand/white-monkey-logo.png", width: 949, height: 253 };

/**
 * The official logo. Uses the logo uploaded in the store settings when there is one, otherwise the
 * bundled artwork. `inverted` turns the black artwork white for dark backgrounds.
 */
export function BrandLogo({
  name = BRAND_NAME,
  logoUrl,
  className,
  inverted,
  priority,
}: {
  name?: string;
  logoUrl?: string | null;
  /** sets the height; the width follows the logo's proportions */
  className?: string;
  inverted?: boolean;
  priority?: boolean;
}) {
  const imgClass = cn("object-contain object-left", inverted && "brightness-0 invert");
  return (
    <span className={cn("relative block aspect-[949/253] h-8 shrink-0", className)}>
      {logoUrl ? (
        <SmartImage src={logoUrl} alt={name} fill sizes="200px" className={imgClass} priority={priority} />
      ) : (
        <Image src={BRAND_LOGO.src} alt={name} fill sizes="200px" className={imgClass} priority={priority} />
      )}
    </span>
  );
}

export function Logo({ name, logoUrl, className }: { name: string; logoUrl: string | null; className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex shrink-0 items-center rounded-lg", className)} aria-label={`${name} – home`}>
      <BrandLogo name={name} logoUrl={logoUrl} priority className="h-7 sm:h-8 lg:h-9" />
    </Link>
  );
}
