"use client";

import Link from "next/link";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Dialog } from "@/components/ui/overlay";
import { RatingStars } from "@/components/ui/rating-stars";
import { Skeleton } from "@/components/ui/skeleton";
import { SmartImage } from "@/components/ui/smart-image";
import { ReviewForm } from "@/features/reviews/item-review";
import { errorMessage } from "@/lib/api/errors";
import { reviewService } from "@/services/account";
import type { MyReview } from "@/types/api";
import { formatDateTime } from "@/utils/format";
import { AccountHeading } from "./account-shell";
import { accountKeys } from "./orders-ui";

const STATUS: Record<MyReview["status"], string> = { APPROVED: "Published", PENDING: "Awaiting approval", HIDDEN: "Not public" };

function ReviewRow({ review }: { review: MyReview }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const invalidate = () => void qc.invalidateQueries({ queryKey: ["account"] });
  const update = useMutation({
    mutationFn: (v: { rating: number; comment: string | null }) => reviewService.update(review.id, v),
    onSuccess: () => {
      toast.success("Review updated");
      setEditing(false);
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: () => reviewService.remove(review.id),
    onSuccess: () => {
      toast.success("Review deleted");
      setConfirm(false);
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <li className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex gap-4">
        <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-sand">
          <SmartImage src={review.product.thumbnailUrl} alt="" fill sizes="64px" className="object-contain p-1.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              {review.product.slug ? (
                <Link href={`/product/${review.product.slug}`} className="font-semibold text-ink underline-offset-4 hover:underline">
                  {review.product.name}
                </Link>
              ) : (
                <p className="font-semibold text-ink">{review.product.name}</p>
              )}
              <p className="text-xs text-muted">
                Order{" "}
                <Link href={`/account/orders/${encodeURIComponent(review.orderNumber)}`} className="underline underline-offset-2">
                  #{review.orderNumber}
                </Link>{" "}
                · {formatDateTime(review.updatedAt)}
              </p>
            </div>
            <span className="rounded-full bg-sand px-2.5 py-1 text-xs font-semibold text-ink">{STATUS[review.status]}</span>
          </div>
          {editing ? (
            <div className="mt-4">
              <ReviewForm initial={review} onSubmit={(v) => update.mutate(v)} onCancel={() => setEditing(false)} submitting={update.isPending} submitLabel="Save changes" />
            </div>
          ) : (
            <>
              <RatingStars value={review.rating} className="mt-2" />
              {review.comment && <p className="mt-2 text-sm leading-relaxed text-ink">{review.comment}</p>}
              <div className="mt-3 flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                  <Pencil className="size-3.5" aria-hidden="true" /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirm(true)}>
                  <Trash2 className="size-3.5" aria-hidden="true" /> Delete
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Delete this review?"
        description="It will be removed from the product page. You can write a new one later."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              Keep
            </Button>
            <Button variant="danger" onClick={() => remove.mutate()} loading={remove.isPending} loadingText="Deleting…">
              Delete review
            </Button>
          </div>
        }
      />
    </li>
  );
}

export function ReviewsView() {
  const q = useInfiniteQuery({
    queryKey: accountKeys.reviews,
    queryFn: ({ pageParam }) => reviewService.mine(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.hasNextPage ? last.meta.page + 1 : undefined),
  });
  const reviews = q.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <AccountHeading title="My Reviews" description="Reviews of products from your delivered orders. Every one shows a Verified Purchase badge." />
      {q.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : q.isError ? (
        <ErrorState title="Something went wrong." description="We couldn't load your reviews." onRetry={() => void q.refetch()} showHome={false} />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={<Star />}
          title="No reviews yet"
          description="Once an order is delivered, you can rate its products from the order page."
        >
          <ButtonLink href="/account/orders?status=delivered">View delivered orders</ButtonLink>
        </EmptyState>
      ) : (
        <>
          <ul className="space-y-3">
            {reviews.map((r) => (
              <ReviewRow key={r.id} review={r} />
            ))}
          </ul>
          {q.hasNextPage && (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" onClick={() => void q.fetchNextPage()} loading={q.isFetchingNextPage} loadingText="Loading…">
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
