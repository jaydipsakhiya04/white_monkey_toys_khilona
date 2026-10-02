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
    <div className={cn("mb-5 flex items-end justify-between gap-4 sm:mb-7", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 id={id} className="text-2xl font-bold text-ink sm:text-3xl lg:text-[2.25rem]">
          {title}
        </h2>
        {description && <p className="mt-1.5 max-w-xl text-[0.9375rem] text-muted">{description}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1 rounded-lg py-2 text-sm font-semibold text-ink underline-offset-4 hover:underline"
        >
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          <span className="sr-only">: {title}</span>
        </Link>
      )}
    </div>
  );
}
