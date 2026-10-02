import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { absoluteUrl } from "@/lib/env";
import { cn } from "@/utils/cn";
import { JsonLd } from "./json-ld";

export type Crumb = { name: string; href?: string };

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const all: Crumb[] = [{ name: "Home", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className={cn("text-sm text-muted", className)}>
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {all.map((c, i) => {
            const last = i === all.length - 1;
            return (
              <li key={`${c.name}-${i}`} className="flex min-w-0 items-center gap-1.5">
                {c.href && !last ? (
                  <Link href={c.href} className="rounded underline-offset-4 hover:text-ink hover:underline">
                    {c.name}
                  </Link>
                ) : (
                  <span aria-current={last ? "page" : undefined} className={cn("line-clamp-1", last && "font-medium text-ink")}>
                    {c.name}
                  </span>
                )}
                {!last && <ChevronRight className="size-3.5 shrink-0 text-muted/60" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.name,
            ...(c.href ? { item: absoluteUrl(c.href) } : {}),
          })),
        }}
      />
    </>
  );
}
