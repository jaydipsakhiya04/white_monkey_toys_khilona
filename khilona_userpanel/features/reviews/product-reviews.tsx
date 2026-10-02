"use client";

import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { BadgeCheck, MessageSquareText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/ui/rating-stars";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api/client";
import type { ProductReviews as ProductReviewsData } from "@/types/api";
import { cn } from "@/utils/cn";

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

export function ProductReviews({ slug, initial }: { slug: string; initial: ProductReviewsData | null }) {
  const [rating, setRating] = useState<number | null>(null);
  const q = useInfiniteQuery({
    queryKey: ["product-reviews", slug, rating],
    queryFn: ({ pageParam }) => api.get<ProductReviewsData>(`/products/${encodeURIComponent(slug)}/reviews`, { page: pageParam, limit: 6, rating }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.hasNextPage ? last.meta.page + 1 : undefined),
    initialData: rating === null && initial ? { pages: [initial], pageParams: [1] } : undefined,
    staleTime: 60_000,
  });
  const summary = initial?.summary ?? q.data?.pages[0]?.summary;
  const reviews = q.data?.pages.flatMap((p) => p.items) ?? [];
  const count = summary?.count ?? 0;

  return (
    <section aria-labelledby="reviews-title" className="mt-14 border-t border-line pt-10 lg:mt-20">
      <div className="grid gap-10 lg:grid-cols-[20rem_1fr] lg:gap-16">
        <div>
          <h2 id="reviews-title" className="text-2xl font-bold text-ink">
            Customer Reviews
          </h2>
          {count > 0 && summary ? (
            <>
              <div className="mt-4 flex items-center gap-3">
                <span className="font-display text-5xl font-semibold tracking-tight text-ink tabular-nums">{summary.average.toFixed(1)}</span>
                <div>
                  <RatingStars value={summary.average} size="md" />
                  <p className="mt-1 text-sm text-muted">
                    Based on {count} {count === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </div>
              <ul className="mt-6 space-y-1.5" aria-label="Rating distribution">
                {[5, 4, 3, 2, 1].map((star) => {
                  const n = summary.distribution[String(star) as "1"];
                  const pct = count ? Math.round((n / count) * 100) : 0;
                  const active = rating === star;
                  return (
                    <li key={star}>
                      <button
                        type="button"
                        disabled={n === 0}
                        onClick={() => setRating(active ? null : star)}
                        aria-pressed={active}
                        aria-label={`${star} star: ${n} ${n === 1 ? "review" : "reviews"}${active ? " (filter on)" : ""}`}
                        className={cn("flex w-full items-center gap-3 rounded-lg px-1.5 py-1 text-sm disabled:opacity-50", active ? "bg-sand" : "enabled:hover:bg-sand")}
                      >
                        <span className="w-8 text-left tabular-nums text-ink">{star} ★</span>
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
                          <span className="block h-full rounded-full bg-ink" style={{ width: `${pct}%` }} />
                        </span>
                        <span className="w-8 text-right tabular-nums text-muted">{n}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="mt-3 text-[0.9375rem] text-muted">No reviews yet.</p>
          )}
          <p className="mt-6 flex items-start gap-2 text-sm text-muted">
            <BadgeCheck className="mt-0.5 size-4 shrink-0 text-ink" aria-hidden="true" />
            <span>
              Only customers who received this product can review it.{" "}
              <Link href="/account/orders?status=delivered" className="font-semibold text-ink underline underline-offset-4">
                Review your purchases
              </Link>
            </span>
          </p>
        </div>

        <div aria-live="polite" className="min-w-0">
          {rating !== null && (
            <p className="mb-4 flex items-center gap-2 text-sm text-muted">
              Showing {rating}-star reviews
              <button type="button" onClick={() => setRating(null)} className="font-semibold text-ink underline underline-offset-4">
                Show all
              </button>
            </p>
          )}
          {q.isPending ? (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center rounded-3xl bg-sand px-6 py-12 text-center">
              <MessageSquareText className="size-7 text-muted" aria-hidden="true" />
              <p className="mt-3 font-semibold text-ink">Be the first to share your thoughts</p>
              <p className="mt-1 max-w-sm text-sm text-muted">Bought this toy? Once your order is delivered, you can rate it from your order page.</p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-line">
                {reviews.map((r) => (
                  <li key={r.id} className="py-6 first:pt-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <RatingStars value={r.rating} />
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-success-700">
                        <BadgeCheck className="size-3.5" aria-hidden="true" /> Verified Purchase
                      </span>
                    </div>
                    {r.comment && <p className="mt-3 whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink [overflow-wrap:anywhere]">{r.comment}</p>}
                    <p className="mt-3 text-sm text-muted">
                      <span className="font-semibold text-ink">{r.authorName}</span>
                      {r.variantTitle && <> · {r.variantTitle}</>} · <time dateTime={r.createdAt}>{dateFmt.format(new Date(r.createdAt))}</time>
                    </p>
                  </li>
                ))}
              </ul>
              {q.hasNextPage && (
                <Button variant="outline" onClick={() => void q.fetchNextPage()} loading={q.isFetchingNextPage} loadingText="Loading…" className="mt-2">
                  Show more reviews
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
