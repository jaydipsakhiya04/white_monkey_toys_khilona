'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  FolderPlus,
  IndianRupee,
  PackagePlus,
  ShoppingBag,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { OrderStatusBadge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { Card, CardHeader, EmptyState, ErrorState, Skeleton, Thumb } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/features/auth/auth-provider';
import { getErrorMessage } from '@/lib/api-client';
import { qk } from '@/lib/query-keys';
import { dashboardService } from '@/services';
import { ORDER_STATUSES, type Dashboard } from '@/types/api';
import { cn } from '@/utils/cn';
import { formatCurrency, formatNumber, formatRelative } from '@/utils/format';
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE } from '@/utils/status';
import { OrdersChart } from './orders-chart';

function greeting(): string {
  const h = Number(new Intl.DateTimeFormat('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }).format(new Date()));
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
  href,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  href?: string;
  accent?: boolean;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <span
          className={cn(
            'flex size-7 items-center justify-center rounded-lg',
            accent ? 'bg-brand-tint text-brand' : 'bg-subtle text-muted',
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="mt-2 truncate text-[22px] font-semibold tracking-tight text-ink tabular sm:text-2xl">{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-muted">{sub}</p>}
    </>
  );
  const cls = 'block rounded-xl border border-line bg-surface p-4 transition-colors';
  return href ? (
    <Link href={href} className={cn(cls, 'hover:border-line-strong')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function MiniStat({ label, value, href, tone }: { label: string; value: number; href?: string; tone?: 'danger' | 'warning' }) {
  const content = (
    <>
      <span className="text-[13px] text-muted">{label}</span>
      <span
        className={cn(
          'text-sm font-semibold tabular',
          tone === 'danger' && value > 0 ? 'text-danger' : tone === 'warning' && value > 0 ? 'text-warning' : 'text-ink',
        )}
      >
        {formatNumber(value)}
      </span>
    </>
  );
  const cls = 'flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5';
  return href ? (
    <Link href={href} className={cn(cls, 'hover:bg-page')}>
      {content}
    </Link>
  ) : (
    <div className={cls}>{content}</div>
  );
}

function StatusBreakdown({ data }: { data: Dashboard['orders'] }) {
  const total = Math.max(data.total, 0);
  return (
    <Card>
      <CardHeader
        title="Orders by status"
        description={`${formatNumber(total)} orders all time`}
        action={
          <Link href="/orders" className={buttonClasses({ variant: 'ghost', size: 'xs' })}>
            All orders <ArrowRight />
          </Link>
        }
      />
      <div className="px-4 pt-4 sm:px-5">
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-subtle" aria-hidden>
          {total > 0 &&
            ORDER_STATUSES.map((s) =>
              data.byStatus[s] ? (
                <span
                  key={s}
                  className={cn('h-full', s === 'CANCELLED' ? 'bg-stone-300' : ORDER_STATUS_STYLE[s].dot)}
                  style={{ width: `${(data.byStatus[s] / total) * 100}%` }}
                />
              ) : null,
            )}
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-px p-2 sm:grid-cols-4 xl:grid-cols-7">
        {ORDER_STATUSES.map((s) => (
          <li key={s}>
            <Link
              href={`/orders?status=${s}`}
              className="flex flex-col gap-1 rounded-lg px-2.5 py-2 hover:bg-page"
            >
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <span className={cn('size-1.5 rounded-full', ORDER_STATUS_STYLE[s].dot)} aria-hidden />
                <span className="truncate">{ORDER_STATUS_LABEL[s]}</span>
              </span>
              <span className="text-lg font-semibold tabular">{formatNumber(data.byStatus[s] ?? 0)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-line bg-surface p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-7 w-28" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>
      <Skeleton className="h-36 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Skeleton className="h-72 rounded-xl xl:col-span-2" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

export function DashboardView() {
  const { admin } = useAuth();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.dashboard,
    queryFn: dashboardService.get,
    refetchInterval: 120_000,
  });

  const pending = data?.orders.byStatus.PENDING ?? 0;

  return (
    <>
      <PageHeader
        title={`${greeting()}${admin?.name ? `, ${admin.name.split(' ')[0]}` : ''}`}
        description="Here's what's happening at the store."
        actions={
          <>
            <Link href="/orders?status=PENDING" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
              <Clock />
              Pending orders
              {pending > 0 && (
                <span className="rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white tabular">{pending}</span>
              )}
            </Link>
            <Link href="/categories?new=1" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
              <FolderPlus />
              New category
            </Link>
            <Link href="/products/new" className={buttonClasses({ size: 'sm' })}>
              <PackagePlus />
              New product
            </Link>
          </>
        }
      />

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError || !data ? (
        <Card>
          <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi
              label="Delivered revenue"
              value={formatCurrency(data.orders.deliveredRevenue)}
              sub={`${formatNumber(data.orders.byStatus.DELIVERED ?? 0)} delivered order${(data.orders.byStatus.DELIVERED ?? 0) === 1 ? "" : "s"}`}
              icon={IndianRupee}
              accent
            />
            <Kpi
              label="Open order value"
              value={formatCurrency(data.orders.openValue)}
              sub="Not yet delivered or cancelled"
              icon={Wallet}
            />
            <Kpi
              label="Pending orders"
              value={formatNumber(pending)}
              sub={pending > 0 ? 'Waiting for confirmation' : 'All caught up'}
              icon={Clock}
              href="/orders?status=PENDING"
              accent={pending > 0}
            />
            <Kpi
              label="Total orders"
              value={formatNumber(data.orders.total)}
              sub={`${formatNumber(data.orders.today)} today`}
              icon={ShoppingBag}
              href="/orders"
            />
          </div>

          <StatusBreakdown data={data.orders} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="min-w-0 xl:col-span-2">
              <CardHeader title="Last 14 days" description="Orders placed per day (store time)" />
              <div className="p-4 sm:p-5">
                {data.ordersLast14Days.length > 0 ? (
                  <OrdersChart data={data.ordersLast14Days} />
                ) : (
                  <EmptyState compact title="No data yet" description="Orders will appear here once customers start ordering." />
                )}
              </div>
            </Card>
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <Card>
                <CardHeader
                  title="Products"
                  action={
                    <Link href="/products" className={buttonClasses({ variant: 'ghost', size: 'xs' })}>
                      Manage <ArrowRight />
                    </Link>
                  }
                />
                <div className="divide-y divide-line">
                  <MiniStat label="Total" value={data.products.total} href="/products" />
                  <MiniStat label="Active" value={data.products.active} href="/products?status=active" />
                  <MiniStat label="Low stock" value={data.products.lowStock} href="/products?stock=low" tone="warning" />
                  <MiniStat label="Out of stock" value={data.products.outOfStock} href="/products?stock=out" tone="danger" />
                </div>
              </Card>
              <Card>
                <CardHeader
                  title="Categories"
                  action={
                    <Link href="/categories" className={buttonClasses({ variant: 'ghost', size: 'xs' })}>
                      Manage <ArrowRight />
                    </Link>
                  }
                />
                <div className="divide-y divide-line">
                  <MiniStat label="Total" value={data.categories.total} href="/categories" />
                  <MiniStat label="Active" value={data.categories.active} href="/categories?status=active" />
                </div>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="min-w-0 xl:col-span-2">
              <CardHeader
                title="Recent orders"
                action={
                  <Link href="/orders" className={buttonClasses({ variant: 'ghost', size: 'xs' })}>
                    View all <ArrowRight />
                  </Link>
                }
              />
              {data.recentOrders.length === 0 ? (
                <EmptyState icon={ShoppingBag} title="No orders yet" description="New orders from the storefront will show up here." />
              ) : (
                <ul className="divide-y divide-line">
                  {data.recentOrders.map((o) => (
                    <li key={o.id}>
                      <Link
                        href={`/orders/${o.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-page sm:px-5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-[13px] font-semibold tabular">{o.orderNumber}</span>
                            <OrderStatusBadge status={o.status} />
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted">
                            {o.customerName} · {o.city} · {formatRelative(o.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] font-semibold tabular">{formatCurrency(o.total)}</p>
                          <p className="text-xs text-muted">
                            {o.itemsCount} item{o.itemsCount === 1 ? '' : 's'}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Low stock"
                description="Restock soon to avoid missed orders"
                action={
                  <Link href="/products?stock=low" className={buttonClasses({ variant: 'ghost', size: 'xs' })}>
                    View <ArrowRight />
                  </Link>
                }
              />
              {data.lowStockProducts.length === 0 ? (
                <EmptyState compact icon={AlertTriangle} title="Stock looks healthy" description="No products are below their low-stock threshold." />
              ) : (
                <ul className="divide-y divide-line">
                  {data.lowStockProducts.map((p) => (
                    <li key={p.id}>
                      <Link href={`/products/${p.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-page sm:px-5">
                        <Thumb src={p.thumbnailUrl} alt={p.name} size={36} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium">{p.name}</p>
                          <p className="truncate text-xs text-muted">{p.sku ? `SKU ${p.sku}` : 'No SKU'}</p>
                        </div>
                        <span
                          className={cn(
                            'rounded-md px-2 py-0.5 text-xs font-semibold tabular ring-1 ring-inset',
                            p.stock === 0 ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-amber-50 text-amber-800 ring-amber-200',
                          )}
                        >
                          {p.stock === 0 ? 'Out' : `${p.stock} left`}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
