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
    <div data-reveal className={cn("mb-7 flex items-end justify-between gap-4 sm:mb-10", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 id={id} className="text-[1.75rem] font-bold leading-[1.05] text-ink sm:text-4xl lg:text-[2.75rem]">
          {title}
        </h2>
        {description && <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-muted sm:text-base">{description}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 text-sm font-semibold text-ink transition-all hover:border-ink hover:shadow-soft"
        >
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          <span className="sr-only">: {title}</span>
        </Link>
      )}
    </div>
  );
}
