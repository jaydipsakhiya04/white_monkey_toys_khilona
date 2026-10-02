"use client";

import { Check, CheckCircle2, Copy, Phone, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ButtonAnchor, ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WhatsAppIcon } from "@/components/icons/brand";
import { useCartStore } from "@/features/cart/cart-store";
import { readOrderSnapshot, saveOrderSnapshot } from "@/features/checkout/order-storage";
import type { PublicOrder } from "@/types/api";
import { formatPrice } from "@/utils/format";
import { whatsappLink } from "@/utils/phone";
import { OrderCustomer, OrderItems, OrderTotals, STATUS_LABEL } from "./order-details";
import { TrackForm } from "./track-form";

export function SuccessView({
  orderNumber,
  storeName,
  phoneUrl,
  whatsapp,
}: {
  orderNumber: string;
  storeName: string;
  phoneUrl: string | null;
  whatsapp: string | null;
}) {
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [checked, setChecked] = useState(false);
  const [copied, setCopied] = useState(false);
  const clearCart = useCartStore((s) => s.clear);
  const hydrated = useCartStore((s) => s.hydrated);

  useEffect(() => {
    setOrder(readOrderSnapshot(orderNumber));
    setChecked(true);
  }, [orderNumber]);

  // the order exists → make sure the cart is cleared (idempotent)
  useEffect(() => {
    if (order && hydrated) clearCart();
  }, [order, hydrated, clearCart]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      toast.success("Order number copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — please note it down");
    }
  };

  const waUrl = whatsapp ? whatsappLink(whatsapp, `Hi ${storeName}, I just placed order ${orderNumber}. Please confirm.`) : null;

  if (!checked) {
    return (
      <div className="mx-auto max-w-3xl space-y-4" aria-hidden="true">
        <Skeleton className="mx-auto size-16 rounded-full" />
        <Skeleton className="mx-auto h-8 w-2/3" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-teal-tint text-teal-700">
            <ShieldCheck className="size-8" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">View your order</h1>
          <p className="mt-2 text-muted">
            For your privacy, please confirm the mobile number used for order <span className="font-semibold text-ink">{orderNumber}</span>.
          </p>
        </div>
        <div className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-7">
          <TrackForm
            defaultOrderNumber={orderNumber}
            lockOrderNumber
            submitLabel="Show my order"
            onFound={(o) => {
              saveOrderSnapshot(o);
              setOrder(o);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-success-tint text-success-700">
          <CheckCircle2 className="size-9" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold text-ink sm:text-[2.75rem]">Order Placed Successfully</h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-muted">
          We have received your order. Our team will contact you regarding delivery/order confirmation.
        </p>
        <div className="mt-6 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3">
          <span className="text-sm text-muted">Order number</span>
          <span className="font-display text-lg font-bold tracking-wide text-ink sm:text-xl" data-testid="order-number">
            {order.orderNumber}
          </span>
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-coral-700 hover:bg-coral-tint"
            aria-label="Copy order number"
          >
            {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">
          Status: <span className="font-semibold text-ink">{STATUS_LABEL[order.status]}</span> · Total{" "}
          <span className="font-semibold text-ink">{formatPrice(order.total)}</span> · Pay on delivery
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <ButtonLink href="/products" size="lg">
          Continue shopping
        </ButtonLink>
        {phoneUrl && (
          <ButtonAnchor href={phoneUrl} size="lg" variant="outline">
            <Phone className="size-4" aria-hidden="true" />
            Call store
          </ButtonAnchor>
        )}
        {waUrl && (
          <ButtonAnchor href={waUrl} target="_blank" rel="noopener noreferrer" size="lg" variant="whatsapp">
            <WhatsAppIcon className="size-4" />
            WhatsApp store
          </ButtonAnchor>
        )}
      </div>

      <div className="mt-10 space-y-6 rounded-3xl border border-line bg-surface p-5 sm:p-8">
        <OrderCustomer order={order} />
        <section aria-labelledby="items-title">
          <h2 id="items-title" className="text-lg font-bold text-ink">
            Items ({order.itemsCount})
          </h2>
          <OrderItems order={order} />
        </section>
        <div className="border-t border-line pt-4 sm:ml-auto sm:max-w-sm">
          <OrderTotals order={order} />
        </div>
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        Save your order number to{" "}
        <a href={`/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}`} className="font-semibold text-ink underline underline-offset-4">
          track your order
        </a>{" "}
        later.
      </p>
    </div>
  );
}
