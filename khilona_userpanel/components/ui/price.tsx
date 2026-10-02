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
};

export function Price({ price, effectivePrice, discountPercent = 0, minPrice, maxPrice, size = "md", className, showBadge = true }: Props) {
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
        <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-white">{discountPercent}% off</span>
      )}
    </div>
  );
}
