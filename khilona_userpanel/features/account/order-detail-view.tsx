"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Phone, ShoppingBag, Star, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/icons/brand";
import { Button, ButtonAnchor, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Dialog } from "@/components/ui/overlay";
import { Skeleton } from "@/components/ui/skeleton";
import { documentFilename, OrderDocuments } from "@/features/orders/document-buttons";
import { isActiveStatus, OrderCustomer, OrderItems, OrderStatusBadge, OrderTotals, StatusTimeline } from "@/features/orders/order-details";
import { ItemReview } from "@/features/reviews/item-review";
import { errorMessage, isApiError } from "@/lib/api/errors";
import { accountService } from "@/services/account";
import type { CustomerOrder } from "@/types/api";
import { formatDateTime } from "@/utils/format";
import { whatsappLink } from "@/utils/phone";
import { useStoreInfo } from "./account-shell";
import { accountKeys } from "./orders-ui";

function CancelOrder({ order }: { order: CustomerOrder }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => accountService.cancel(order.orderNumber, reason.trim() || undefined),
    onSuccess: (updated) => {
      qc.setQueryData(accountKeys.order(order.orderNumber), updated);
      void qc.invalidateQueries({ queryKey: ["account"] });
      setOpen(false);
      toast.success(`Order ${order.orderNumber} cancelled`);
    },
    onError: (e) => toast.error(errorMessage(e, "Couldn't cancel the order.")),
  });
  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)} className="text-danger-700 hover:bg-danger-tint">
        <XCircle className="size-4" aria-hidden="true" /> Cancel order
      </Button>
      <Dialog
        open={open}
        onClose={() => !m.isPending && setOpen(false)}
        title="Cancel this order?"
        description="You can cancel while the store hasn't confirmed your order yet. This can't be undone."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={m.isPending}>
              Keep order
            </Button>
            <Button variant="danger" onClick={() => m.mutate()} loading={m.isPending} loadingText="Cancelling…">
              Yes, cancel order
            </Button>
          </div>
        }
      >
        <div className="px-5 py-4">
          <label htmlFor="cancel-reason" className="text-sm font-semibold text-ink">
            Reason <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="cancel-reason"
            value={reason}
            maxLength={300}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Ordered by mistake"
            className="mt-1.5 h-11 w-full rounded-xl border border-line-strong px-3.5 text-[0.9375rem] focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
          />
        </div>
      </Dialog>
    </>
  );
}

export function OrderDetailView({ orderNumber }: { orderNumber: string }) {
  const { storeName, phoneUrl, whatsappUrl } = useStoreInfo();
  const q = useQuery({
    queryKey: accountKeys.order(orderNumber),
    queryFn: () => accountService.order(orderNumber),
    staleTime: 0,
    refetchOnWindowFocus: true,
    // admin status changes show up automatically while the order is in progress
    refetchInterval: (query) => (query.state.data && isActiveStatus(query.state.data.status) ? 60_000 : false),
  });

  if (q.isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
      </div>
    );
  }
  if (q.isError) {
    if (isApiError(q.error) && q.error.status === 404) {
      return (
        <EmptyState icon={<ShoppingBag />} title="Order not found" description="We couldn't find this order in your account.">
          <ButtonLink href="/account/orders">Back to my orders</ButtonLink>
        </EmptyState>
      );
    }
    return <ErrorState title="Something went wrong." description="We couldn't load this order. Please try again." onRetry={() => void q.refetch()} showHome={false} />;
  }

  const order = q.data;
  const delivered = order.status === "DELIVERED";
  const toReview = order.items.filter((i) => i.canReview).length;
  const wa = whatsappUrl ? whatsappLink(whatsappUrl, `Hi ${storeName}, I have a question about my order ${order.orderNumber}.`) : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" /> My orders
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[1.45rem] font-bold tracking-tight text-ink [overflow-wrap:anywhere] xs:text-[1.6rem] sm:text-[2rem]">Order #{order.orderNumber}</h1>
            <p className="mt-1 text-sm text-muted">
              Placed {formatDateTime(order.createdAt)}
              {order.deliveredAt && ` · Delivered ${formatDateTime(order.deliveredAt)}`}
            </p>
          </div>
          <OrderStatusBadge status={order.status} className="text-sm" />
        </div>
      </div>

      {delivered && (
        <section className="rounded-3xl bg-ink p-5 text-white sm:p-7" aria-labelledby="delivered-title">
          <h2 id="delivered-title" className="text-xl font-semibold sm:text-2xl">
            Your order has been delivered 🎉
          </h2>
          <p className="mt-1.5 text-sm text-white/70">
            {toReview > 0
              ? `Tell other families what you think — ${toReview} ${toReview === 1 ? "product is" : "products are"} waiting for your review.`
              : "Thank you for shopping with us. Your invoice and receipt are ready below."}
          </p>
          {toReview > 0 && (
            <a href="#items-title" className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-ink hover:bg-white/90">
              <Star className="size-4" aria-hidden="true" /> Rate your products
            </a>
          )}
        </section>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <div className="space-y-6">
          <section aria-labelledby="tracking-title" className="rounded-3xl border border-line bg-surface p-5 sm:p-7">
            <h2 id="tracking-title" className="mb-5 text-lg font-semibold text-ink">
              Tracking
            </h2>
            <StatusTimeline order={order} />
          </section>

          <section aria-labelledby="items-title" className="scroll-mt-28 rounded-3xl border border-line bg-surface p-5 sm:p-7">
            <h2 id="items-title" className="text-lg font-semibold text-ink">
              Products ({order.itemsCount})
            </h2>
            <OrderItems
              order={order}
              renderExtra={(i) =>
                order.items[i].productId ? <ItemReview orderNumber={order.orderNumber} item={order.items[i]} onChanged={() => void q.refetch()} /> : null
              }
            />
            {!delivered && order.status !== "CANCELLED" && (
              <p className="mt-2 text-xs text-muted">You can review these products once your order is delivered.</p>
            )}
          </section>

          <OrderDocuments
            className="rounded-3xl border border-line bg-surface p-5 sm:p-7"
            available={order.documents}
            fetcher={(kind) => accountService.document(order.orderNumber, kind)}
            filename={(kind) => documentFilename(storeName, kind, order.orderNumber)}
          />

          <section aria-labelledby="delivery-title" className="rounded-3xl border border-line bg-surface p-5 sm:p-7">
            <h2 id="delivery-title" className="mb-4 text-lg font-semibold text-ink">
              Delivery
            </h2>
            <OrderCustomer order={order} />
            {order.customerNote && <p className="mt-3 text-sm italic text-muted">Note: “{order.customerNote}”</p>}
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-28">
          <section aria-labelledby="pricing-title" className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
            <h2 id="pricing-title" className="mb-4 text-lg font-semibold text-ink">
              Pricing
            </h2>
            <OrderTotals order={order} />
          </section>


          <section aria-label="Order actions" className="flex flex-wrap gap-2">
            <ButtonLink href="/products" variant="outline" size="sm">
              <ShoppingBag className="size-4" aria-hidden="true" /> Continue shopping
            </ButtonLink>
            {phoneUrl && (
              <ButtonAnchor href={phoneUrl} variant="outline" size="sm">
                <Phone className="size-4" aria-hidden="true" /> Contact store
              </ButtonAnchor>
            )}
            {wa && (
              <ButtonAnchor href={wa} target="_blank" rel="noopener noreferrer" variant="outline" size="sm">
                <WhatsAppIcon className="size-4" /> WhatsApp
              </ButtonAnchor>
            )}
            {order.canCancel && <CancelOrder order={order} />}
          </section>
        </aside>
      </div>
    </div>
  );
}
