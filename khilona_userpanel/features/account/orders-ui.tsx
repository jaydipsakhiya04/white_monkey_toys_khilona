"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ChevronRight, PackagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SmartImage } from "@/components/ui/smart-image";
import { OrderStatusBadge } from "@/features/orders/order-details";
import { errorMessage, isApiError } from "@/lib/api/errors";
import { ORDER_NUMBER_EXAMPLE, ORDER_NUMBER_PATTERN } from "@/lib/brand";
import { accountService } from "@/services/account";
import type { CustomerOrderListItem } from "@/types/api";
import { formatDateTime, formatPrice, pluralize } from "@/utils/format";

export const accountKeys = {
  summary: ["account", "summary"] as const,
  orders: (status?: string) => ["account", "orders", status ?? "all"] as const,
  order: (n: string) => ["account", "order", n] as const,
  reviews: ["account", "reviews"] as const,
  profile: ["account", "profile"] as const,
};

/** One order in a list: number, date, products preview, total, status, view details. */
export function OrderCard({ order }: { order: CustomerOrderListItem }) {
  const extra = order.linesCount - order.itemsPreview.length;
  return (
    <li>
      <Link
        href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}
        className="group block rounded-2xl border border-line bg-surface p-4 transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-soft sm:p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <p className="font-semibold tracking-tight text-ink">
              <span className="sr-only">Order </span>#{order.orderNumber}
            </p>
            <p className="text-sm text-muted">{formatDateTime(order.createdAt)}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex -space-x-3">
            {order.itemsPreview.slice(0, 4).map((it, i) => (
              <span key={i} className="relative size-12 overflow-hidden rounded-xl border-2 border-surface bg-sand">
                <SmartImage src={it.imageUrl} alt="" fill sizes="48px" className="object-contain p-1" />
              </span>
            ))}
            {extra > 0 && (
              <span className="grid size-12 place-items-center rounded-xl border-2 border-surface bg-sand text-xs font-semibold text-ink">+{extra}</span>
            )}
          </div>
          <p className="min-w-0 flex-1 truncate text-sm text-muted">
            {order.itemsPreview.map((i) => i.productName).join(", ")}
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
          <p className="text-muted">
            {pluralize(order.itemsCount, "item")} · <span className="font-semibold text-ink tabular-nums">{formatPrice(order.total)}</span>
          </p>
          <span className="inline-flex items-center gap-1 font-semibold text-ink">
            View details
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </li>
  );
}

export function OrderListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-44 w-full rounded-2xl" />
      ))}
    </div>
  );
}

/**
 * "Add a previous order": links a guest order placed with the account's mobile number.
 * The server checks order number + mobile — the same proof used by guest tracking.
 */
export function ClaimOrderForm() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();
  const router = useRouter();
  const m = useMutation({
    mutationFn: (orderNumber: string) => accountService.claim(orderNumber),
    onSuccess: (order) => {
      toast.success(`Order ${order.orderNumber} added to your account`);
      void qc.invalidateQueries({ queryKey: ["account"] });
      router.push(`/account/orders/${encodeURIComponent(order.orderNumber)}`);
    },
    onError: (e) => setError(isApiError(e) && (e.status === 404 || e.status === 409) ? e.message : errorMessage(e)),
  });

  return (
    <section aria-labelledby="claim-title" className="rounded-2xl bg-sand p-5">
      <h2 id="claim-title" className="flex items-center gap-2 text-base font-semibold text-ink">
        <PackagePlus className="size-[1.125rem]" aria-hidden="true" />
        Ordered as a guest before?
      </h2>
      <p className="mt-1 text-sm text-muted">Add a previous order placed with your account&apos;s mobile number using its order number.</p>
      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const v = value.trim().toUpperCase();
          if (!ORDER_NUMBER_PATTERN.test(v)) return setError(`Enter an order number like ${ORDER_NUMBER_EXAMPLE}`);
          setError(null);
          m.mutate(v);
        }}
      >
        <label htmlFor="claim-order" className="sr-only">
          Order number
        </label>
        <input
          id="claim-order"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={ORDER_NUMBER_EXAMPLE}
          autoCapitalize="characters"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "claim-error" : undefined}
          className="h-11 w-full min-w-0 rounded-full border border-line-strong bg-surface px-4 sm:flex-1 text-[0.9375rem] uppercase text-ink placeholder:normal-case placeholder:text-muted/70 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
        />
        <Button type="submit" variant="dark" loading={m.isPending} loadingText="Adding…">
          Add order
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </form>
      {error && (
        <p id="claim-error" role="alert" className="mt-2 text-sm font-medium text-danger-700">
          {error}
        </p>
      )}
    </section>
  );
}
