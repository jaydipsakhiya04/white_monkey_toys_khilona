import { Check, Circle, MapPin, Package, User, X } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import type { OrderStatus, PublicOrder } from "@/types/api";
import { cn } from "@/utils/cn";
import { formatDateTime, formatPrice } from "@/utils/format";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Order placed",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const FLOW: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];

export function OrderItems({ order }: { order: PublicOrder }) {
  return (
    <ul className="divide-y divide-line">
      {order.items.map((it, i) => (
        <li key={`${it.productName}-${i}`} className="flex items-center gap-3 py-3">
          <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-sand">
            <SmartImage src={it.imageUrl} alt="" fill sizes="56px" className="object-contain p-1" />
          </span>
          <div className="min-w-0 flex-1 text-sm">
            <p className="line-clamp-2 font-semibold text-ink">{it.productName}</p>
            <p className="text-muted">
              {it.options.length > 0
                ? it.options.map((o) => `${o.name}: ${o.value}`).join(" · ")
                : it.variantTitle
                  ? it.variantTitle
                  : null}
              {it.options.length > 0 || it.variantTitle ? " · " : ""}
              Qty {it.quantity} × {formatPrice(it.unitPrice)}
            </p>
          </div>
          <p className="text-sm font-semibold tabular-nums text-ink">{formatPrice(it.lineTotal)}</p>
        </li>
      ))}
    </ul>
  );
}

export function OrderTotals({ order }: { order: PublicOrder }) {
  const mrpBased = order.discount > 0 && Math.abs(order.subtotal - order.discount + order.shippingFee - order.total) < 0.01;
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted">{mrpBased ? "Price (MRP)" : "Subtotal"}</dt>
        <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
      </div>
      {order.discount > 0 && (
        <div className="flex justify-between">
          <dt className="text-muted">{mrpBased ? "Discount" : "You saved"}</dt>
          <dd className="tabular-nums text-success-700">−{formatPrice(order.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-muted">Delivery</dt>
        <dd className="tabular-nums">{order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}</dd>
      </div>
      <div className="flex items-baseline justify-between border-t border-line pt-2.5">
        <dt className="font-display text-base font-bold text-ink">Total</dt>
        <dd className="font-display text-lg font-bold tabular-nums text-ink">{formatPrice(order.total)}</dd>
      </div>
      <p className="pt-1 text-xs text-muted">Payment: Cash / pay on delivery{order.paymentStatus === "PAID" ? " · Paid" : ""}</p>
    </dl>
  );
}

export function OrderCustomer({ order }: { order: PublicOrder }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl bg-sand p-4 text-sm">
        <p className="mb-1.5 flex items-center gap-2 font-bold text-ink">
          <User className="size-4" aria-hidden="true" /> Customer
        </p>
        <p className="font-semibold text-ink">{order.customerName}</p>
        <p className="text-muted">{order.customerPhone}</p>
        {order.alternatePhone && <p className="text-muted">Alt: {order.alternatePhone}</p>}
        {order.customerEmail && <p className="break-all text-muted">{order.customerEmail}</p>}
      </div>
      <div className="rounded-2xl bg-sand p-4 text-sm">
        <p className="mb-1.5 flex items-center gap-2 font-bold text-ink">
          <MapPin className="size-4" aria-hidden="true" /> Delivery address
        </p>
        <p className="whitespace-pre-line text-ink">{order.address}</p>
        <p className="text-muted">
          {order.city}, {order.state} – {order.pincode}
        </p>
        {order.landmark && <p className="text-muted">Landmark: {order.landmark}</p>}
        {order.googleMapsLink && (
          <a href={order.googleMapsLink} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-semibold text-coral-700 underline-offset-4 hover:underline">
            View on map
          </a>
        )}
      </div>
    </div>
  );
}

export function StatusTimeline({ order }: { order: PublicOrder }) {
  const when = (s: OrderStatus) => order.history.find((h) => h.status === s)?.createdAt;
  if (order.status === "CANCELLED") {
    const at = when("CANCELLED");
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-danger-tint p-4 text-danger-700" role="status">
        <X className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-bold">This order was cancelled</p>
          {at && <p className="text-sm">{formatDateTime(at)}</p>}
          <p className="mt-1 text-sm">If you have questions, please contact the store.</p>
        </div>
      </div>
    );
  }
  const currentIdx = FLOW.indexOf(order.status);
  // READY / PROCESSING may be skipped; only show steps that happened or are still ahead
  const steps = FLOW.filter((s, i) => i >= currentIdx || when(s) || s === "PENDING");
  return (
    <ol className="relative space-y-0" aria-label="Order status">
      {steps.map((s, i) => {
        const idx = FLOW.indexOf(s);
        const done = idx <= currentIdx;
        const current = idx === currentIdx;
        const at = when(s) ?? (s === "PENDING" ? order.createdAt : undefined);
        const last = i === steps.length - 1;
        return (
          <li key={s} className="relative flex gap-4 pb-6 last:pb-0" aria-current={current ? "step" : undefined}>
            {!last && (
              <span
                className={cn("absolute left-[0.9375rem] top-8 h-[calc(100%-2rem)] w-0.5", done && idx < currentIdx ? "bg-success-700" : "bg-line")}
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                "relative z-10 grid size-8 shrink-0 place-items-center rounded-full",
                done ? (current ? "bg-ink text-white" : "bg-success-700 text-white") : "border border-line-strong bg-surface text-line-strong",
              )}
              aria-hidden="true"
            >
              {done && !current ? <Check className="size-4" /> : current ? <Package className="size-4" /> : <Circle className="size-3" />}
            </span>
            <div className="pt-1">
              <p className={cn("font-semibold", done ? "text-ink" : "text-muted")}>
                {STATUS_LABEL[s]}
                {current && <span className="sr-only"> (current status)</span>}
              </p>
              {done && at && <p className="text-sm text-muted">{formatDateTime(at)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
