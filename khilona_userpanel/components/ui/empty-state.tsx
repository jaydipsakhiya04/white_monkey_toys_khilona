import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export function EmptyState({
  icon,
  title,
  description,
  children,
  className,
  headingLevel = "h2",
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  headingLevel?: "h1" | "h2" | "h3";
}) {
  const H = headingLevel;
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-12 text-center sm:py-16",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-sand text-coral [&_svg]:size-7" aria-hidden="true">
          {icon}
        </div>
      )}
      <H className="text-xl font-bold text-ink sm:text-2xl">{title}</H>
      {description && <p className="mt-2 max-w-md text-[0.9375rem] text-muted">{description}</p>}
      {children && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{children}</div>}
    </div>
  );
}
