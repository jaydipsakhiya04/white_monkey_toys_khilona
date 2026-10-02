import Link from "next/link";
import { Ban, Check, CheckCircle2, CircleDot, Clock3, MapPin, PackageCheck, Truck, User, type LucideIcon } from "lucide-react";
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

const STATUS_HINT: Record<OrderStatus, string> = {
  PENDING: "We've received your order and will confirm it shortly.",
  CONFIRMED: "Your order is confirmed by the store.",
  PROCESSING: "Your toys are being packed.",
  READY: "Packed and ready to go.",
  OUT_FOR_DELIVERY: "On the way to you today.",
  DELIVERED: "Delivered. Enjoy!",
  CANCELLED: "This order was cancelled.",
};

const STATUS_ICON: Record<OrderStatus, LucideIcon> = {
  PENDING: Clock3,
  CONFIRMED: CheckCircle2,
  PROCESSING: CircleDot,
  READY: PackageCheck,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: CheckCircle2,
  CANCELLED: Ban,
};

const FLOW: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];

export const isActiveStatus = (s: OrderStatus) => s !== "DELIVERED" && s !== "CANCELLED";

/** Status pill: icon + text label, so status never relies on colour alone. */
export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const Icon = STATUS_ICON[status];
  const tone =
    status === "DELIVERED"
      ? "bg-success-tint text-success-700"
      : status === "CANCELLED"
        ? "bg-danger-tint text-danger-700"
        : status === "PENDING"
          ? "bg-sand text-ink"
          : "bg-ink text-white";
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", tone, className)}>
      <Icon className="size-3.5" aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function OrderItems({ order, renderExtra }: { order: PublicOrder; renderExtra?: (index: number) => React.ReactNode }) {
  return (
    <ul className="divide-y divide-line">
      {order.items.map((it, i) => (
        <li key={`${it.productName}-${i}`} className="py-4 first:pt-2">
          <div className="flex items-start gap-3 sm:gap-4">
            <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-sand sm:size-[4.5rem]">
              <SmartImage src={it.imageUrl} alt="" fill sizes="72px" className="object-contain p-1.5" />
            </span>
            <div className="min-w-0 flex-1 text-sm">
              {it.productSlug ? (
                <Link href={`/product/${it.productSlug}`} className="line-clamp-2 font-semibold text-ink underline-offset-4 hover:underline">
                  {it.productName}
                </Link>
              ) : (
                <p className="line-clamp-2 font-semibold text-ink">{it.productName}</p>
              )}
              {(it.options.length > 0 || it.variantTitle) && (
                <p className="mt-0.5 text-muted">
                  {it.options.length > 0 ? it.options.map((o) => `${o.name}: ${o.value}`).join(" · ") : it.variantTitle}
                </p>
              )}
              <p className="mt-0.5 text-muted">
                Qty {it.quantity} × {formatPrice(it.unitPrice)}
                {it.unitMrp > it.unitPrice && <span className="ml-1.5 line-through">{formatPrice(it.unitMrp)}</span>}
                {it.sku && <span className="ml-2 hidden text-xs sm:inline">SKU {it.sku}</span>}
              </p>
            </div>
            <p className="text-sm font-semibold tabular-nums text-ink">{formatPrice(it.lineTotal)}</p>
          </div>
          {renderExtra?.(i)}
        </li>
      ))}
    </ul>
  );
}

export function OrderTotals({ order }: { order: PublicOrder }) {
  return (
    <dl className="space-y-2.5 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted">Subtotal{order.discount > 0 ? " (MRP)" : ""}</dt>
        <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
      </div>
      {order.discount > 0 && (
        <div className="flex justify-between">
          <dt className="text-muted">Discount</dt>
          <dd className="tabular-nums text-success-700">−{formatPrice(order.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-muted">Shipping</dt>
        <dd className="tabular-nums">{order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}</dd>
      </div>
      <div className="flex items-baseline justify-between border-t border-line pt-3">
        <dt className="font-display text-base font-semibold text-ink">Total</dt>
        <dd className="font-display text-xl font-semibold tabular-nums text-ink">{formatPrice(order.total)}</dd>
      </div>
      <p className="pt-1 text-xs text-muted">
        Payment: Pay on delivery (cash / UPI)
        {order.paymentStatus === "PAID" ? " · Paid" : order.status === "CANCELLED" ? "" : " · Due on delivery"}
      </p>
    </dl>
  );
}

export function OrderCustomer({ order }: { order: PublicOrder }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl bg-sand p-4 text-sm">
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          <User className="size-3.5" aria-hidden="true" /> Contact
        </p>
        <p className="font-semibold text-ink">{order.customerName}</p>
        <p className="text-muted">{order.customerPhone}</p>
        {order.alternatePhone && <p className="text-muted">Alt: {order.alternatePhone}</p>}
        {order.customerEmail && <p className="break-all text-muted">{order.customerEmail}</p>}
      </div>
      <div className="rounded-2xl bg-sand p-4 text-sm">
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          <MapPin className="size-3.5" aria-hidden="true" /> Delivery address
        </p>
        <p className="whitespace-pre-line text-ink">{order.address}</p>
        <p className="text-muted">
          {order.city}, {order.state} – {order.pincode}
        </p>
        {order.landmark && <p className="text-muted">Landmark: {order.landmark}</p>}
        {order.googleMapsLink && (
          <a href={order.googleMapsLink} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-semibold text-ink underline-offset-4 hover:underline">
            View on map
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Visual order timeline: done (✓), current (●) and upcoming (○) steps, each with a text label and
 * date/time — readable without colour. Skipped optional steps (e.g. READY) are omitted.
 */
export function StatusTimeline({ order }: { order: Pick<PublicOrder, "status" | "history" | "createdAt"> }) {
  const when = (s: OrderStatus) => order.history.find((h) => h.status === s)?.createdAt;
  if (order.status === "CANCELLED") {
    const at = when("CANCELLED");
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger-tint p-4 text-danger-700" role="status">
        <Ban className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold">This order was cancelled</p>
          {at && <p className="text-sm">{formatDateTime(at)}</p>}
          <p className="mt-1 text-sm">Any reserved stock has been released. Questions? Please contact the store.</p>
        </div>
      </div>
    );
  }
  const currentIdx = FLOW.indexOf(order.status);
  const steps = FLOW.filter((s, i) => i >= currentIdx || when(s) || s === "PENDING");
  return (
    <ol className="relative" aria-label="Order status">
      {steps.map((s, i) => {
        const idx = FLOW.indexOf(s);
        const done = idx < currentIdx;
        const current = idx === currentIdx;
        const at = when(s) ?? (s === "PENDING" ? order.createdAt : undefined);
        const last = i === steps.length - 1;
        return (
          <li key={s} className="relative flex gap-4 pb-6 last:pb-0" aria-current={current ? "step" : undefined}>
            {!last && (
              <span
                className={cn("absolute left-[0.9375rem] top-8 h-[calc(100%-2rem)] w-0.5 rounded-full", done ? "bg-ink" : "bg-line")}
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                "relative z-10 grid size-8 shrink-0 place-items-center rounded-full transition-colors",
                done && "bg-ink text-white",
                current && (s === "DELIVERED" ? "bg-success-700 text-white" : "bg-surface text-ink ring-2 ring-ink"),
                !done && !current && "border border-line-strong bg-surface",
              )}
              aria-hidden="true"
            >
              {done || (current && s === "DELIVERED") ? (
                <Check className="size-4" strokeWidth={2.5} />
              ) : current ? (
                <span className="size-2.5 animate-pulse rounded-full bg-ink" />
              ) : null}
            </span>
            <div className="min-w-0 pt-1">
              <p className={cn("font-semibold leading-tight", done || current ? "text-ink" : "text-muted")}>
                {STATUS_LABEL[s]}
                <span className="sr-only">{done ? " (completed)" : current ? " (current status)" : " (upcoming)"}</span>
              </p>
              {(done || current) && at && <p className="mt-0.5 text-sm text-muted">{formatDateTime(at)}</p>}
              {current && <p className="mt-1 text-sm text-ink">{STATUS_HINT[s]}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
