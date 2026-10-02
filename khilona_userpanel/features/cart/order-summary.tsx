import type { CartValidation } from "@/types/api";
import { cn } from "@/utils/cn";
import { formatPrice } from "@/utils/format";

type Summary = CartValidation["summary"];

/**
 * Renders the server-computed totals. Handles both interpretations of
 * `subtotal` (MRP total vs. already-discounted total) by checking the arithmetic.
 */
export function OrderSummaryRows({ summary, className }: { summary: Summary; className?: string }) {
  const { subtotal, discount, shippingFee, total, itemsCount } = summary;
  const mrpBased = discount > 0 && Math.abs(subtotal - discount + shippingFee - total) < 0.01;
  return (
    <dl className={cn("space-y-2.5 text-[0.9375rem]", className)}>
      <div className="flex justify-between gap-4">
        <dt className="text-muted">
          {mrpBased ? "Price (MRP)" : "Subtotal"} · {itemsCount} {itemsCount === 1 ? "item" : "items"}
        </dt>
        <dd className="font-medium tabular-nums text-ink">{formatPrice(subtotal)}</dd>
      </div>
      {mrpBased && (
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Discount</dt>
          <dd className="font-medium tabular-nums text-success-700">−{formatPrice(discount)}</dd>
        </div>
      )}
      <div className="flex justify-between gap-4">
        <dt className="text-muted">Delivery</dt>
        <dd className={cn("font-medium tabular-nums", shippingFee === 0 ? "text-success-700" : "text-ink")}>
          {shippingFee === 0 ? "Free" : formatPrice(shippingFee)}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
        <dt className="font-display text-lg font-bold text-ink">Total</dt>
        <dd className="font-display text-xl font-bold tabular-nums text-ink" data-testid="order-total">
          {formatPrice(total)}
        </dd>
      </div>
      {!mrpBased && discount > 0 && (
        <p className="rounded-lg bg-success-tint px-3 py-2 text-sm font-semibold text-success-700">You save {formatPrice(discount)} on this order</p>
      )}
    </dl>
  );
}
