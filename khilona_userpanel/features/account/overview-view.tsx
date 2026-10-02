"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Package, Truck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { firstName, useAuth } from "@/features/auth/auth-provider";
import { accountService } from "@/services/account";
import { AccountHeading } from "./account-shell";
import { accountKeys, ClaimOrderForm, OrderCard, OrderListSkeleton } from "./orders-ui";

export function OverviewView() {
  const { customer } = useAuth();
  const q = useQuery({ queryKey: accountKeys.summary, queryFn: accountService.summary, staleTime: 0, refetchOnWindowFocus: true });

  const stats = [
    { label: "Total orders", value: q.data?.totalOrders, icon: Package, href: "/account/orders" },
    { label: "Active orders", value: q.data?.activeOrders, icon: Truck, href: "/account/orders?status=active" },
    { label: "Delivered", value: q.data?.deliveredOrders, icon: CheckCircle2, href: "/account/orders?status=delivered" },
  ];

  return (
    <>
      <AccountHeading title={`Hello, ${firstName(customer?.name)}`} description="Here's what's happening with your orders." />

      <ul className="grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className="block rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-line-strong sm:p-5">
              <s.icon className="size-5 text-muted" aria-hidden="true" />
              {q.isPending ? (
                <Skeleton className="mt-3 h-8 w-10" />
              ) : (
                <p className="mt-3 font-display text-2xl font-semibold tabular-nums text-ink sm:text-3xl">{s.value ?? "—"}</p>
              )}
              <p className="mt-0.5 text-xs text-muted sm:text-sm">{s.label}</p>
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="recent-title" className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="recent-title" className="text-lg font-semibold text-ink sm:text-xl">
            Recent orders
          </h2>
          {(q.data?.totalOrders ?? 0) > 0 && (
            <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-ink underline-offset-4 hover:underline">
              View all <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          )}
        </div>
        {q.isPending ? (
          <OrderListSkeleton count={2} />
        ) : q.isError ? (
          <ErrorState title="Something went wrong." description="We couldn't load your orders. Please try again." onRetry={() => void q.refetch()} showHome={false} />
        ) : q.data.recentOrders.length === 0 ? (
          <EmptyState icon={<Package />} title="No orders yet" description="When you place an order while logged in, it will show up here.">
            <ButtonLink href="/products">Start shopping</ButtonLink>
          </EmptyState>
        ) : (
          <ul className="space-y-3">
            {q.data.recentOrders.map((o) => (
              <OrderCard key={o.orderNumber} order={o} />
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10">
        <ClaimOrderForm />
      </div>
    </>
  );
}
