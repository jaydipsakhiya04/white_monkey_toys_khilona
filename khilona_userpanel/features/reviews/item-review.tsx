"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RatingInput, RatingStars } from "@/components/ui/rating-stars";
import { errorMessage } from "@/lib/api/errors";
import { reviewService } from "@/services/account";
import type { CustomerOrderItem, OwnReview } from "@/types/api";
import { cn } from "@/utils/cn";

const STATUS_NOTE: Record<OwnReview["status"], string | null> = {
  APPROVED: null,
  PENDING: "Awaiting approval — it will appear on the product page once approved.",
  HIDDEN: "This review isn't shown publicly.",
};

/** Review editor (create or edit). Rating required; written review optional. */
export function ReviewForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = "Submit review",
}: {
  initial?: { rating: number; comment: string | null };
  onSubmit: (v: { rating: number; comment: string | null }) => void;
  onCancel?: () => void;
  submitting: boolean;
  submitLabel?: string;
}) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!rating) return setError("Please choose a rating from 1 to 5 stars");
        setError(null);
        onSubmit({ rating, comment: comment.trim() || null });
      }}
      className="space-y-3"
    >
      <RatingInput value={rating} onChange={(v) => { setRating(v); setError(null); }} error={error ?? undefined} label="How was this product?" />
      <div>
        <label htmlFor="review-text" className="text-sm font-semibold text-ink">
          Write your review <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="review-text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="What did your little one think? How's the quality?"
          className="mt-1.5 block w-full rounded-xl border border-line-strong bg-surface px-3.5 py-3 text-[0.9375rem] leading-relaxed text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
        />
        <p className="mt-1 text-right text-xs text-muted tabular-nums">{comment.length}/2000</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" loading={submitting} loadingText="Saving…">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

/**
 * Review block under a product of a delivered order. Eligibility (`canReview`) comes from the
 * API; this component never decides it.
 */
export function ItemReview({ orderNumber, item, onChanged }: { orderNumber: string; item: CustomerOrderItem; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [startRating, setStartRating] = useState(0);
  const qc = useQueryClient();
  const refresh = () => {
    onChanged();
    void qc.invalidateQueries({ queryKey: ["account", "reviews"] });
  };

  const create = useMutation({
    mutationFn: (v: { rating: number; comment: string | null }) => reviewService.create({ orderNumber, productId: item.productId!, ...v }),
    onSuccess: (r) => {
      toast.success(r.status === "PENDING" ? "Thanks! Your review will appear once approved." : "Thanks! Your review has been submitted.");
      setOpen(false);
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e, "Couldn't submit your review. Please try again.")),
  });
  const update = useMutation({
    mutationFn: (v: { rating: number; comment: string | null }) => reviewService.update(item.review!.id, v),
    onSuccess: () => {
      toast.success("Review updated");
      setEditing(false);
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e, "Couldn't update your review.")),
  });

  if (item.review) {
    const note = STATUS_NOTE[item.review.status];
    return (
      <div className="mt-3 rounded-2xl bg-sand p-4 sm:ml-[5.5rem]">
        {editing ? (
          <ReviewForm initial={item.review} onSubmit={(v) => update.mutate(v)} onCancel={() => setEditing(false)} submitting={update.isPending} submitLabel="Save changes" />
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                <BadgeCheck className="size-4" aria-hidden="true" /> You reviewed this product
              </p>
              <RatingStars value={item.review.rating} size="sm" className="mt-1.5" />
              {item.review.comment && <p className="mt-1.5 text-sm leading-relaxed text-ink">{item.review.comment}</p>}
              {note && <p className="mt-1.5 text-xs text-muted">{note}</p>}
            </div>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)} aria-label={`Edit your review of ${item.productName}`}>
              <Pencil className="size-3.5" aria-hidden="true" /> Edit
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (!item.canReview) return null;

  return (
    <div className={cn("mt-3 rounded-2xl border border-line p-4 sm:ml-[5.5rem]", open && "bg-sand/50")}>
      {open ? (
        <ReviewForm
          initial={{ rating: startRating, comment: null }}
          onSubmit={(v) => create.mutate(v)}
          onCancel={() => setOpen(false)}
          submitting={create.isPending}
        />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink">How was this product?</p>
          <div className="flex items-center gap-2">
            <RatingInput
              value={0}
              size="md"
              label={`Rate ${item.productName}`}
              onChange={(v) => {
                setStartRating(v);
                setOpen(true);
              }}
            />
          </div>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            Write a review
          </Button>
        </div>
      )}
    </div>
  );
}
