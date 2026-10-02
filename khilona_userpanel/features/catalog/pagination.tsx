import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMeta } from "@/types/api";
import { cn } from "@/utils/cn";

function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

/** Server-rendered pagination (crawlable links; filters preserved). */
export function Pagination({ meta, basePath, searchParams }: { meta: PaginationMeta; basePath: string; searchParams: URLSearchParams }) {
  if (meta.totalPages <= 1) return null;
  const href = (page: number) => {
    const sp = new URLSearchParams(searchParams);
    if (page <= 1) sp.delete("page");
    else sp.set("page", String(page));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const item = "grid h-11 min-w-11 place-items-center rounded-xl px-2 text-sm font-semibold tabular-nums";

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-col items-center gap-3">
      <ul className="flex flex-wrap items-center justify-center gap-1.5">
        <li>
          {meta.hasPrevPage ? (
            <Link href={href(meta.page - 1)} className={cn(item, "gap-1 border border-line-strong bg-surface px-3 hover:bg-sand")} rel="prev">
              <ChevronLeft className="size-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Prev</span>
            </Link>
          ) : (
            <span className={cn(item, "gap-1 border border-line px-3 text-muted/50")} aria-disabled="true">
              <ChevronLeft className="size-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Prev</span>
            </span>
          )}
        </li>
        {pageList(meta.page, meta.totalPages).map((p, i) =>
          p === "…" ? (
            <li key={`e${i}`} className="px-1 text-muted" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={href(p)}
                aria-current={p === meta.page ? "page" : undefined}
                aria-label={`Page ${p}`}
                className={cn(item, p === meta.page ? "bg-ink text-white" : "border border-line bg-surface text-ink hover:bg-sand")}
              >
                {p}
              </Link>
            </li>
          ),
        )}
        <li>
          {meta.hasNextPage ? (
            <Link href={href(meta.page + 1)} className={cn(item, "gap-1 border border-line-strong bg-surface px-3 hover:bg-sand")} rel="next">
              <span className="sr-only sm:not-sr-only">Next</span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <span className={cn(item, "gap-1 border border-line px-3 text-muted/50")} aria-disabled="true">
              <span className="sr-only sm:not-sr-only">Next</span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </span>
          )}
        </li>
      </ul>
      <p className="text-xs text-muted">
        Page {meta.page} of {meta.totalPages} · {meta.total} products
      </p>
    </nav>
  );
}
