"use client";

import { Star } from "lucide-react";
import { useId, useState, type KeyboardEvent } from "react";
import { cn } from "@/utils/cn";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/** Read-only star rating (supports fractions, e.g. 4.5). */
export function RatingStars({ value, size = "sm", className }: { value: number; size?: "xs" | "sm" | "md" | "lg"; className?: string }) {
  const px = { xs: "size-3", sm: "size-3.5", md: "size-4", lg: "size-5" }[size];
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className={cn("relative inline-block", px)} aria-hidden="true">
            <Star className={cn("absolute inset-0 text-line-strong", px)} fill="currentColor" strokeWidth={0} />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={cn("text-accent", px)} fill="currentColor" strokeWidth={0} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/** Compact "★ 4.8 (24)" used on product cards. */
export function RatingSummaryInline({ average, count, className }: { average: number; count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-muted", className)}>
      <RatingStars value={average} size="xs" />
      <span className="font-semibold text-ink tabular-nums">{average.toFixed(1)}</span>
      <span className="tabular-nums">({count})</span>
      <span className="sr-only">{count === 1 ? "review" : "reviews"}</span>
    </span>
  );
}

/** Accessible 1–5 star input (radio group; arrow keys supported). */
export function RatingInput({
  value,
  onChange,
  label = "Your rating",
  error,
  size = "lg",
}: {
  value: number;
  onChange: (v: number) => void;
  label?: string;
  error?: string;
  size?: "md" | "lg";
}) {
  const [hover, setHover] = useState(0);
  const groupId = useId();
  const shown = hover || value;
  const px = size === "lg" ? "size-8" : "size-6";

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.min(5, (value || 0) + 1));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.max(1, (value || 1) - 1));
    }
  };

  return (
    <div>
      <div
        role="radiogroup"
        aria-labelledby={`${groupId}-label`}
        aria-describedby={error ? `${groupId}-error` : undefined}
        onKeyDown={onKey}
        className="flex items-center gap-3"
      >
        <span id={`${groupId}-label`} className="sr-only">
          {label}
        </span>
        <span className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={value === i}
              aria-label={`${i} star${i > 1 ? "s" : ""} – ${LABELS[i]}`}
              tabIndex={value === i || (!value && i === 1) ? 0 : -1}
              onClick={() => onChange(i)}
              onMouseEnter={() => setHover(i)}
              className="rounded-md p-0.5 transition-transform hover:scale-110 active:scale-95"
            >
              <Star className={cn(px, i <= shown ? "text-accent" : "text-line-strong")} fill="currentColor" strokeWidth={0} aria-hidden="true" />
            </button>
          ))}
        </span>
        <span className="min-w-20 text-sm font-semibold text-ink" aria-hidden="true">
          {LABELS[shown]}
        </span>
      </div>
      {error && (
        <p id={`${groupId}-error`} role="alert" className="mt-1.5 text-sm font-medium text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}
