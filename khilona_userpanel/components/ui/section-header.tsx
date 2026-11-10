import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export function SectionHeader({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
  id,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  href?: string;
  linkLabel?: string;
  id?: string;
  className?: string;
}) {
  return (
    <div data-reveal className={cn("mb-6 flex items-end justify-between gap-3 sm:mb-8 sm:gap-6", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2.5 sm:mb-3">{eyebrow}</p>}
        <h2 id={id} className="text-balance text-[1.5rem] font-bold leading-[1.1] text-ink sm:text-[2rem] lg:text-[2.25rem]">
          {title}
        </h2>
        {description && <p className="mt-2 line-clamp-2 max-w-md text-[0.8125rem] leading-relaxed text-muted sm:text-sm">{description}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 text-[0.8125rem] font-semibold text-ink transition-colors hover:border-ink sm:h-10 sm:px-4 sm:text-sm"
        >
          <span className="max-xs:sr-only">{linkLabel}</span>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          <span className="sr-only">: {title}</span>
        </Link>
      )}
    </div>
  );
}
