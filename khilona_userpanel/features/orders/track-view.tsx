"use client";

import { useRef, useState } from "react";
import type { PublicOrder } from "@/types/api";
import { formatDateTime } from "@/utils/format";
import { OrderCustomer, OrderItems, OrderTotals, STATUS_LABEL, StatusTimeline } from "./order-details";
import { TrackForm } from "./track-form";

export function TrackView({ defaultOrderNumber }: { defaultOrderNumber: string }) {
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start xl:gap-12">
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-7 lg:sticky lg:top-24">
        <h2 className="text-lg font-bold text-ink">Find your order</h2>
        <p className="mb-5 mt-1 text-sm text-muted">Enter the order number from your confirmation and the mobile number used to order.</p>
        <TrackForm
          defaultOrderNumber={defaultOrderNumber}
          onFound={(o) => {
            setOrder(o);
            requestAnimationFrame(() => {
              resultRef.current?.focus({ preventScroll: true });
              resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
          }}
        />
      </div>

      <div aria-live="polite">
        {order ? (
          <div className="space-y-6 rounded-3xl border border-line bg-surface p-5 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 ref={resultRef} tabIndex={-1} className="scroll-mt-28 text-2xl font-bold text-ink focus:outline-none">
                  {order.orderNumber}
                </h2>
                <p className="text-sm text-muted">Placed {formatDateTime(order.createdAt)}</p>
              </div>
              <span className="rounded-full bg-ink px-3 py-1 text-sm font-bold text-white">{STATUS_LABEL[order.status]}</span>
            </div>
            <StatusTimeline order={order} />
            <OrderCustomer order={order} />
            <section aria-labelledby="track-items">
              <h3 id="track-items" className="text-lg font-bold text-ink">
                Items ({order.itemsCount})
              </h3>
              <OrderItems order={order} />
            </section>
            <div className="border-t border-line pt-4 sm:ml-auto sm:max-w-sm">
              <OrderTotals order={order} />
            </div>
          </div>
        ) : (
          <div className="hidden rounded-3xl border border-dashed border-line-strong bg-sand/50 p-10 text-center lg:block">
            <p className="font-display text-xl font-bold text-ink">Your order status will appear here</p>
            <p className="mt-2 text-sm text-muted">We&apos;ll show every step from confirmation to delivery.</p>
          </div>
        )}
      </div>
    </div>
  );
}
