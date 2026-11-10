"use client";

import { AskPriceButton, usePricing } from "@/features/store/pricing";
import { cn } from "@/utils/cn";
import { formatPrice } from "@/utils/format";

type Props = {
  price: number; // MRP
  effectivePrice: number;
  discountPercent?: number;
  /** show "From ₹x" when a range exists */
  minPrice?: number;
  maxPrice?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showBadge?: boolean;
  /** While prices are hidden: product to ask about on WhatsApp ("Ask for price"). */
  askFor?: { name: string; sku?: string | null };
};

export function Price({ price, effectivePrice, discountPercent = 0, minPrice, maxPrice, size = "md", className, showBadge = true, askFor }: Props) {
  const { showPrices } = usePricing();
  if (!showPrices) {
    return askFor ? (
      <AskPriceButton productName={askFor.name} sku={askFor.sku} size={size === "lg" ? "lg" : "sm"} className={className} />
    ) : (
      <p className={cn("text-sm font-semibold text-ink", className)}>Price on request</p>
    );
  }
  const hasRange = minPrice !== undefined && maxPrice !== undefined && maxPrice > minPrice;
  const onSale = !hasRange && effectivePrice < price;
  const main = size === "lg" ? "text-[1.75rem] sm:text-3xl" : size === "md" ? "text-lg" : "text-base";
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      {hasRange ? (
        <p className={cn("font-display font-semibold tracking-[-0.01em] text-ink tabular-nums", main)}>
          <span className="mr-1 text-[0.7em] font-semibold text-muted">From</span>
          {formatPrice(minPrice)}
        </p>
      ) : (
        <p className={cn("font-display font-semibold tracking-[-0.01em] text-ink tabular-nums", main)}>
          <span className="sr-only">{onSale ? "Sale price: " : "Price: "}</span>
          {formatPrice(effectivePrice)}
        </p>
      )}
      {onSale && (
        <p className={cn("text-muted line-through tabular-nums", size === "lg" ? "text-lg" : "text-sm")}>
          <span className="sr-only">Original price: </span>
          {formatPrice(price)}
        </p>
      )}
      {onSale && showBadge && discountPercent > 0 && (
        <span className="rounded-full bg-accent-tint px-2.5 py-0.5 text-xs font-bold text-accent-deep">{discountPercent}% off</span>
      )}
    </div>
  );
}
