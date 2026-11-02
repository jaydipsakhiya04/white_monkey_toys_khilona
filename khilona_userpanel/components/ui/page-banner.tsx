import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { SmartImage } from "./smart-image";

/** Editorial page header used by listing / category pages: soft grey panel, product photo on the right. */
export function PageBanner({
  eyebrow,
  title,
  description,
  meta,
  imageUrl,
  imageAlt = "",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
  imageUrl?: string | null;
  imageAlt?: string;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "relative mt-4 grid animate-rise overflow-hidden rounded-[2rem] bg-sand p-6 text-ink sm:p-9 lg:p-11",
        imageUrl && "md:grid-cols-[1fr_auto] md:items-center md:gap-10",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className={cn("text-[2rem] font-extrabold leading-[1.04] tracking-[-0.04em] sm:text-[2.75rem] lg:text-[3.25rem]", eyebrow && "mt-4")}>
          {title}
        </h1>
        {description && <div className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-muted sm:text-base">{description}</div>}
        {meta && <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">{meta}</div>}
      </div>
      {imageUrl && (
        <div className="photo-stage relative hidden aspect-square w-48 overflow-hidden rounded-[1.5rem] !bg-white shadow-soft md:block lg:w-56">
          <SmartImage src={imageUrl} alt={imageAlt} fill priority sizes="224px" className="object-contain p-4" />
        </div>
      )}
    </header>
  );
}

/** Small pill for banner meta rows. */
export function BannerPill({ children }: { children: ReactNode }) {
  return <span className="inline-flex h-8 items-center rounded-full bg-white px-3.5 font-semibold text-ink ring-1 ring-line">{children}</span>;
}
