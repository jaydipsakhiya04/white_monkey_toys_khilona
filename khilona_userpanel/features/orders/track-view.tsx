"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PartyPopper, UserRoundPlus } from "lucide-react";
import { useRef, useState } from "react";
import { useAuth } from "@/features/auth/auth-provider";
import { accountService } from "@/services/account";
import { trackOrder } from "@/services/orders";
import type { PublicOrder } from "@/types/api";
import { formatDateTime } from "@/utils/format";
import { documentFilename, OrderDocuments } from "./document-buttons";
import { isActiveStatus, OrderCustomer, OrderItems, OrderStatusBadge, OrderTotals, StatusTimeline } from "./order-details";
import { TrackForm } from "./track-form";

export function TrackView({ defaultOrderNumber, storeName }: { defaultOrderNumber: string; storeName: string }) {
  const [lookup, setLookup] = useState<{ order: PublicOrder; phone: string } | null>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const { isAuthenticated } = useAuth();

  // keep the status fresh while the order is in progress (admin updates show up without a reload)
  const live = useQuery({
    queryKey: ["track", lookup?.order.orderNumber, lookup?.phone],
    queryFn: () => trackOrder(lookup!.order.orderNumber, lookup!.phone),
    enabled: !!lookup,
    initialData: lookup?.order,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: (q) => (q.state.data && isActiveStatus(q.state.data.status) ? 60_000 : false),
  });
  const order = live.data ?? lookup?.order ?? null;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start xl:gap-12">
      <div className="rounded-3xl border border-line bg-surface p-5 sm:p-7 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold text-ink">Find your order</h2>
        <p className="mb-5 mt-1 text-sm text-muted">Enter the order number from your confirmation and the mobile number used to order.</p>
        <TrackForm
          defaultOrderNumber={defaultOrderNumber}
          onFound={(o, phone) => {
            setLookup({ order: o, phone });
            requestAnimationFrame(() => {
              resultRef.current?.focus({ preventScroll: true });
              resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
          }}
        />
        {!isAuthenticated && (
          <p className="mt-6 flex items-start gap-2 border-t border-line pt-5 text-sm text-muted">
            <UserRoundPlus className="mt-0.5 size-4 shrink-0 text-ink" aria-hidden="true" />
            <span>
              Have an account?{" "}
              <Link href="/login?next=/account/orders" className="font-semibold text-ink underline underline-offset-4">
                Log in
              </Link>{" "}
              to see all your orders in one place.
            </span>
          </p>
        )}
      </div>

      <div aria-live="polite">
        {order && lookup ? (
          <div className="space-y-7 rounded-3xl border border-line bg-surface p-5 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 ref={resultRef} tabIndex={-1} className="scroll-mt-28 text-2xl font-semibold tracking-tight text-ink focus:outline-none">
                  {order.orderNumber}
                </h2>
                <p className="text-sm text-muted">Placed {formatDateTime(order.createdAt)}</p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
            {order.status === "DELIVERED" && (
              <p className="flex items-center gap-2 rounded-2xl bg-success-tint px-4 py-3 text-sm font-semibold text-success-700">
                <PartyPopper className="size-4" aria-hidden="true" /> Your order has been delivered 🎉
              </p>
            )}
            <StatusTimeline order={order} />
            <OrderCustomer order={order} />
            <section aria-labelledby="track-items">
              <h3 id="track-items" className="text-lg font-semibold text-ink">
                Items ({order.itemsCount})
              </h3>
              <OrderItems order={order} />
            </section>
            <div className="border-t border-line pt-5 sm:ml-auto sm:max-w-sm">
              <OrderTotals order={order} />
            </div>
            <OrderDocuments
              available={{ invoice: order.status !== "CANCELLED", receipt: true }}
              fetcher={(kind) => accountService.guestDocument(order.orderNumber, lookup.phone, kind)}
              filename={(kind) => documentFilename(storeName, kind, order.orderNumber)}
            />
          </div>
        ) : (
          <div className="hidden rounded-3xl border border-dashed border-line-strong bg-sand/50 p-10 text-center lg:block">
            <p className="font-display text-xl font-semibold text-ink">Your order status will appear here</p>
            <p className="mt-2 text-sm text-muted">We&apos;ll show every step from confirmation to delivery.</p>
          </div>
        )}
      </div>
    </div>
  );
}
