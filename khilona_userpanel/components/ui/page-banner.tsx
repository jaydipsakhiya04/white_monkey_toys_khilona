import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { SmartImage } from "./smart-image";

/** Dark editorial page header used by listing / category pages. */
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
        "relative isolate mt-4 grid animate-rise overflow-hidden rounded-[2rem] bg-midnight p-6 text-white sm:p-9 lg:p-11",
        imageUrl && "md:grid-cols-[1fr_auto] md:items-center md:gap-10",
        className,
      )}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-32 size-80 rounded-full bg-accent/25 blur-[100px]" />
        <div className="absolute -bottom-32 right-10 size-80 rounded-full bg-[#6d5dfc]/20 blur-[100px]" />
        <div className="bg-grain absolute inset-0 opacity-60" />
      </div>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow !text-accent">{eyebrow}</p>}
        <h1 className={cn("text-[2.25rem] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-5xl lg:text-[3.5rem]", eyebrow && "mt-3")}>
          {title}
        </h1>
        {description && <div className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-white/70 sm:text-base">{description}</div>}
        {meta && <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">{meta}</div>}
      </div>
      {imageUrl && (
        <div className="relative hidden aspect-square w-52 rotate-[3deg] overflow-hidden rounded-[1.75rem] bg-sand shadow-[0_30px_80px_-20px_rgb(0_0_0/0.7)] ring-1 ring-white/10 transition-transform duration-500 hover:rotate-0 md:block lg:w-64">
          <SmartImage src={imageUrl} alt={imageAlt} fill priority sizes="256px" className="object-cover" />
        </div>
      )}
    </header>
  );
}

/** Small pill for banner meta rows. */
export function BannerPill({ children }: { children: ReactNode }) {
  return <span className="inline-flex h-8 items-center rounded-full bg-white/10 px-3.5 font-semibold text-white ring-1 ring-white/10">{children}</span>;
}
