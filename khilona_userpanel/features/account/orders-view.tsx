"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { accountService, type OrderFilter } from "@/services/account";
import { cn } from "@/utils/cn";
import { AccountHeading } from "./account-shell";
import { accountKeys, ClaimOrderForm, OrderCard, OrderListSkeleton } from "./orders-ui";

const FILTERS: { value: OrderFilter; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "active", label: "Active" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function OrdersView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = params.get("status");
  const status = (["active", "delivered", "cancelled"].includes(raw ?? "") ? raw : undefined) as OrderFilter;

  const q = useInfiniteQuery({
    queryKey: accountKeys.orders(status),
    queryFn: ({ pageParam }) => accountService.orders(pageParam, status),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.hasNextPage ? last.meta.page + 1 : undefined),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  const orders = q.data?.pages.flatMap((p) => p.items) ?? [];
  const total = q.data?.pages[0]?.meta.total ?? 0;

  return (
    <>
      <AccountHeading title="My Orders" description={q.isSuccess ? `${total} ${total === 1 ? "order" : "orders"}${status ? ` · ${status}` : ""}` : "Newest first"} />

      <div role="tablist" aria-label="Filter orders" className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
        {FILTERS.map((f) => {
          const active = f.value === status;
          return (
            <button
              key={f.label}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => router.replace(f.value ? `${pathname}?status=${f.value}` : pathname, { scroll: false })}
              className={cn(
                "h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-colors",
                active ? "bg-ink text-white" : "border border-line text-ink hover:border-line-strong",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {q.isPending ? (
        <OrderListSkeleton />
      ) : q.isError ? (
        <ErrorState title="Something went wrong." description="We couldn't load your orders. Please try again." onRetry={() => void q.refetch()} showHome={false} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title={status ? `No ${status} orders` : "No orders yet"}
          description={status ? "Try a different filter." : "Orders you place while logged in will appear here. Placed one as a guest? Add it below."}
        >
          <ButtonLink href="/products">Browse toys</ButtonLink>
        </EmptyState>
      ) : (
        <>
          <ul className="space-y-3">
            {orders.map((o) => (
              <OrderCard key={o.orderNumber} order={o} />
            ))}
          </ul>
          {q.hasNextPage && (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" onClick={() => void q.fetchNextPage()} loading={q.isFetchingNextPage} loadingText="Loading…">
                Load more orders
              </Button>
            </div>
          )}
        </>
      )}

      <div className="mt-10">
        <ClaimOrderForm />
      </div>
    </>
  );
}
