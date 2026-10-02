"use client";

import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Spinner } from "@/components/ui/spinner";
import { documentFilename, useDocumentDownload } from "@/features/orders/document-buttons";
import { OrderStatusBadge } from "@/features/orders/order-details";
import { accountService } from "@/services/account";
import type { CustomerOrderListItem, DocumentKind } from "@/types/api";
import { formatDateTime, formatPrice } from "@/utils/format";
import { AccountHeading, useStoreInfo } from "./account-shell";
import { accountKeys, OrderListSkeleton } from "./orders-ui";

function DocRow({ order }: { order: CustomerOrderListItem }) {
  const { storeName } = useStoreInfo();
  const { busy, download } = useDocumentDownload(
    (kind) => accountService.document(order.orderNumber, kind),
    (kind) => documentFilename(storeName, kind, order.orderNumber),
  );
  const kinds: DocumentKind[] = order.status === "CANCELLED" ? ["receipt"] : ["invoice", "receipt"];
  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="min-w-0">
        <Link href={`/account/orders/${encodeURIComponent(order.orderNumber)}`} className="font-semibold text-ink underline-offset-4 hover:underline">
          #{order.orderNumber}
        </Link>
        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted">
          {formatDateTime(order.createdAt)} · {formatPrice(order.total)}
          <OrderStatusBadge status={order.status} />
        </p>
      </div>
      <div className="flex gap-2">
        {kinds.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => void download(kind)}
            disabled={busy !== null}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-semibold text-ink transition-colors hover:border-ink disabled:opacity-60"
          >
            {busy === kind ? <Spinner className="size-4" /> : <Download className="size-4" aria-hidden="true" />}
            {kind === "invoice" ? "Invoice" : "Receipt"}
            <span className="sr-only"> for order {order.orderNumber}</span>
          </button>
        ))}
      </div>
    </li>
  );
}

export function DocumentsView() {
  const q = useInfiniteQuery({
    queryKey: accountKeys.orders("documents"),
    queryFn: ({ pageParam }) => accountService.orders(pageParam, undefined, 20),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.hasNextPage ? last.meta.page + 1 : undefined),
  });
  const orders = q.data?.pages.flatMap((p) => p.items) ?? [];
  return (
    <>
      <AccountHeading title="Documents" description="Download invoices and order receipts as PDF. Documents always reflect the prices you paid." />
      {q.isPending ? (
        <OrderListSkeleton count={2} />
      ) : q.isError ? (
        <ErrorState title="Something went wrong." description="We couldn't load your documents." onRetry={() => void q.refetch()} showHome={false} />
      ) : orders.length === 0 ? (
        <EmptyState icon={<FileText />} title="No documents yet" description="Invoices and receipts appear here after you place an order.">
          <ButtonLink href="/products">Start shopping</ButtonLink>
        </EmptyState>
      ) : (
        <>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {orders.map((o) => (
              <DocRow key={o.orderNumber} order={o} />
            ))}
          </ul>
          {q.hasNextPage && (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" onClick={() => void q.fetchNextPage()} loading={q.isFetchingNextPage} loadingText="Loading…">
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
