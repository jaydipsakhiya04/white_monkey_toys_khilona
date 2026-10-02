"use client";

import Link from "next/link";
import { Check, CheckCircle2, Copy, Package, Phone, ShieldCheck, Truck, UserRoundPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WhatsAppIcon } from "@/components/icons/brand";
import { useAuth } from "@/features/auth/auth-provider";
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
  const { isAuthenticated } = useAuth();

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
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-sand text-ink">
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
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink sm:text-[2.75rem]">Order Placed Successfully</h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-muted">
          Thank you for shopping with <span className="font-semibold text-ink">{storeName}</span>. We&apos;ll keep you updated about your order —
          our team will contact you to confirm it and arrange delivery.
        </p>
        <div className="mt-6 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3">
          <span className="text-sm text-muted">Order number</span>
          <span className="font-display text-lg font-bold tracking-wide text-ink sm:text-xl" data-testid="order-number">
            {order.orderNumber}
          </span>
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-ink hover:bg-sand"
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

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        <ButtonLink href={`/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}`} size="lg">
          <Truck className="size-4" aria-hidden="true" />
          Track order
        </ButtonLink>
        {isAuthenticated && order.linkedToAccount !== false && (
          <ButtonLink href="/account/orders" size="lg" variant="outline">
            <Package className="size-4" aria-hidden="true" />
            View my orders
          </ButtonLink>
        )}
        <ButtonLink href="/products" size="lg" variant="outline">
          Continue shopping
        </ButtonLink>
      </div>
      {(phoneUrl || waUrl) && (
        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted">
          Questions about your order?
          {phoneUrl && (
            <a href={phoneUrl} className="inline-flex items-center gap-1.5 font-semibold text-ink underline-offset-4 hover:underline">
              <Phone className="size-4" aria-hidden="true" /> Call store
            </a>
          )}
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-ink underline-offset-4 hover:underline">
              <WhatsAppIcon className="size-4" /> WhatsApp store
            </a>
          )}
        </p>
      )}

      {!isAuthenticated && (
        <div className="mt-8 flex flex-col gap-4 rounded-3xl bg-sand p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex gap-3">
            <UserRoundPlus className="mt-0.5 size-5 shrink-0 text-ink" aria-hidden="true" />
            <div>
              <p className="font-semibold text-ink">Create an account to easily track all your future orders.</p>
              <p className="mt-1 text-sm text-muted">
                Optional. You can always track this order with its number and your mobile on the{" "}
                <Link href="/track-order" className="underline underline-offset-4">
                  Track Order
                </Link>{" "}
                page — or add it to your new account later.
              </p>
            </div>
          </div>
          <ButtonLink href="/signup" variant="dark" className="shrink-0">
            Create account
          </ButtonLink>
        </div>
      )}

      <div className="mt-10 space-y-6 rounded-3xl border border-line bg-surface p-5 sm:p-8">
        <OrderCustomer order={order} />
        <section aria-labelledby="items-title">
          <h2 id="items-title" className="text-lg font-semibold text-ink">
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
