'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Clock,
  FolderPlus,
  IndianRupee,
  Layers,
  PackagePlus,
  ShoppingBag,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useId } from 'react';
import { InitialsAvatar } from '@/components/ui/avatar';
import { OrderStatusBadge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { Card, CardHeader, EmptyState, ErrorState, Skeleton, Thumb } from '@/components/ui/feedback';
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

function todayLabel(): string {
  return new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' }).format(new Date());
}

/** Percentage change of the last 7 days vs the 7 days before (null when there is no baseline). */
function weekTrend(values: number[]): number | null {
  if (values.length < 14) return null;
  const prev = values.slice(-14, -7).reduce((s, v) => s + v, 0);
  const curr = values.slice(-7).reduce((s, v) => s + v, 0);
  if (prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 100);
}

function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const id = useId();
  if (values.length < 2) return null;
  const w = 120;
  const h = 36;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - (v / max) * (h - 8)] as const);
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn('h-9 w-28', className)} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w} ${h} L0 ${h} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Trend({ value }: { value: number | null }) {
  if (value === null) return null;
  const up = value >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular',
        up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
      )}
      title="Last 7 days vs the 7 days before"
    >
      {up ? <ArrowUpRight className="size-3" aria-hidden /> : <ArrowDownRight className="size-3" aria-hidden />}
      {Math.abs(value)}%<span className="sr-only"> vs previous week</span>
    </span>
  );
}

const KPI_TONES = {
  brand: 'from-[#FF8A55] to-brand text-white shadow-brand',
  violet: 'from-[#9B87FF] to-[#6D4AFF] text-white shadow-[0_6px_16px_-6px_rgb(109_74_255/0.6)]',
  amber: 'from-[#FFC857] to-[#F59E0B] text-white shadow-[0_6px_16px_-6px_rgb(245_158_11/0.6)]',
  teal: 'from-[#4FD1C5] to-[#0E8A8C] text-white shadow-[0_6px_16px_-6px_rgb(14_138_140/0.6)]',
} as const;

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
  href,
  tone,
  spark,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  href?: string;
  tone: keyof typeof KPI_TONES;
  spark?: number[];
  trend?: number | null;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className={cn('flex size-10 items-center justify-center rounded-xl bg-gradient-to-br', KPI_TONES[tone])}>
          <Icon className="size-[18px]" aria-hidden />
        </span>
        {spark && <Sparkline values={spark} className={tone === 'violet' ? 'text-[#6D4AFF]' : tone === 'teal' ? 'text-info' : 'text-brand'} />}
      </div>
      <p className="mt-4 text-[13px] font-medium text-muted">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="truncate font-display text-[24px] font-bold tracking-[-0.03em] text-ink tabular sm:text-[28px]">{value}</p>
        {trend !== undefined && <Trend value={trend} />}
      </div>
      {sub && <p className="mt-1 truncate text-xs text-muted">{sub}</p>}
    </>
  );
  const cls =
    'group relative block overflow-hidden rounded-card border border-line bg-surface p-4 shadow-card transition-all duration-200 sm:p-5';
  return href ? (
    <Link href={href} className={cn(cls, 'hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised')}>
      {body}
      <ArrowUpRight
        className="absolute bottom-4 right-4 size-4 text-stone-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand"
        aria-hidden
      />
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
          'font-display text-[15px] font-bold tabular',
          tone === 'danger' && value > 0 ? 'text-danger' : tone === 'warning' && value > 0 ? 'text-warning' : 'text-ink',
        )}
      >
        {formatNumber(value)}
      </span>
    </>
  );
  const cls = 'flex items-center justify-between gap-3 rounded-xl border border-line bg-stone-50/60 px-3.5 py-3 transition-colors';
  return href ? (
    <Link href={href} className={cn(cls, 'hover:border-line-strong hover:bg-surface')}>
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
      <div className="px-4 pt-5 sm:px-5">
        <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-stone-100" aria-hidden>
          {total > 0 &&
            ORDER_STATUSES.map((s) =>
              data.byStatus[s] ? (
                <span
                  key={s}
                  className={cn('h-full first:rounded-l-full last:rounded-r-full', s === 'CANCELLED' ? 'bg-stone-300' : ORDER_STATUS_STYLE[s].dot)}
                  style={{ width: `${(data.byStatus[s] / total) * 100}%` }}
                />
              ) : null,
            )}
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 sm:p-4 xl:grid-cols-7">
        {ORDER_STATUSES.map((s) => (
          <li key={s}>
            <Link
              href={`/orders?status=${s}`}
              className="flex flex-col gap-1.5 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-line hover:bg-stone-50"
            >
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <span className={cn('size-2 rounded-full', ORDER_STATUS_STYLE[s].dot)} aria-hidden />
                <span className="truncate">{ORDER_STATUS_LABEL[s]}</span>
              </span>
              <span className="font-display text-xl font-bold tabular">{formatNumber(data.byStatus[s] ?? 0)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-card border border-line bg-surface p-5 shadow-card">
            <Skeleton className="size-10 rounded-xl" />
            <Skeleton className="mt-4 h-3.5 w-24" />
            <Skeleton className="mt-3 h-7 w-28" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-card" />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Skeleton className="h-80 rounded-card xl:col-span-2" />
        <Skeleton className="h-80 rounded-card" />
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
  const counts = data?.ordersLast14Days.map((d) => d.count) ?? [];
  const totals = data?.ordersLast14Days.map((d) => d.total) ?? [];

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative mb-6 overflow-hidden rounded-[20px] bg-night p-5 text-white shadow-raised sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-70" aria-hidden />
        <div className="pointer-events-none absolute -right-24 -top-32 size-96 rounded-full bg-brand/35 blur-[100px]" aria-hidden />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 size-80 rounded-full bg-[#7C5CFF]/25 blur-[100px]" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/45">{todayLabel()}</p>
            <h1 className="mt-2 font-display text-[26px] font-bold leading-tight tracking-[-0.03em] sm:text-[32px]">
              {`${greeting()}${admin?.name ? `, ${admin.name.split(' ')[0]}` : ''}`}
            </h1>
            <p className="mt-1.5 text-sm text-white/60">
              {data
                ? pending > 0
                  ? `You have ${formatNumber(pending)} order${pending === 1 ? '' : 's'} waiting for confirmation · ${formatNumber(data.orders.today)} placed today.`
                  : `All caught up — ${formatNumber(data.orders.today)} order${data.orders.today === 1 ? '' : 's'} placed today.`
                : "Here's what's happening at the store."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/orders?status=PENDING"
              className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-white/15 bg-white/[0.07] px-3.5 text-[13px] font-medium text-white backdrop-blur transition-colors hover:bg-white/[0.12]"
            >
              <Clock className="size-4" aria-hidden />
              Pending orders
              {pending > 0 && (
                <span className="rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white tabular">{pending}</span>
              )}
            </Link>
            <Link
              href="/categories?new=1"
              className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-white/15 bg-white/[0.07] px-3.5 text-[13px] font-medium text-white backdrop-blur transition-colors hover:bg-white/[0.12]"
            >
              <FolderPlus className="size-4" aria-hidden />
              New category
            </Link>
            <Link href="/products/new" className={buttonClasses({ size: 'md' })}>
              <PackagePlus />
              New product
            </Link>
          </div>
        </div>
      </section>

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError || !data ? (
        <Card>
          <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 stagger sm:gap-4 lg:grid-cols-4">
            <Kpi
              label="Delivered revenue"
              value={formatCurrency(data.orders.deliveredRevenue)}
              sub={`${formatNumber(data.orders.byStatus.DELIVERED ?? 0)} delivered order${(data.orders.byStatus.DELIVERED ?? 0) === 1 ? '' : 's'}`}
              icon={IndianRupee}
              tone="brand"
            />
            <Kpi
              label="Open order value"
              value={formatCurrency(data.orders.openValue)}
              sub="Not yet delivered or cancelled"
              icon={Wallet}
              tone="violet"
              spark={totals}
              trend={weekTrend(totals)}
            />
            <Kpi
              label="Pending orders"
              value={formatNumber(pending)}
              sub={pending > 0 ? 'Waiting for confirmation' : 'All caught up'}
              icon={Clock}
              href="/orders?status=PENDING"
              tone="amber"
            />
            <Kpi
              label="Total orders"
              value={formatNumber(data.orders.total)}
              sub={`${formatNumber(data.orders.today)} today`}
              icon={ShoppingBag}
              href="/orders"
              tone="teal"
              spark={counts}
              trend={weekTrend(counts)}
            />
          </div>

          <div className="animate-enter">
            <StatusBreakdown data={data.orders} />
          </div>

          <div className="grid animate-enter grid-cols-1 gap-5 xl:grid-cols-3">
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
            <Card className="min-w-0">
              <CardHeader
                title="Catalogue health"
                description="Products and categories at a glance"
                action={
                  <Link href="/products" className={buttonClasses({ variant: 'ghost', size: 'xs' })}>
                    Manage <ArrowRight />
                  </Link>
                }
              />
              <div className="flex flex-col gap-4 p-4 sm:p-5">
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">
                    <PackagePlus className="size-3.5" aria-hidden /> Products
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <MiniStat label="Total" value={data.products.total} href="/products" />
                    <MiniStat label="Active" value={data.products.active} href="/products?status=active" />
                    <MiniStat label="Low stock" value={data.products.lowStock} href="/products?stock=low" tone="warning" />
                    <MiniStat label="Out of stock" value={data.products.outOfStock} href="/products?stock=out" tone="danger" />
                  </div>
                </div>
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">
                    <Layers className="size-3.5" aria-hidden /> Categories
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <MiniStat label="Total" value={data.categories.total} href="/categories" />
                    <MiniStat label="Active" value={data.categories.active} href="/categories?status=active" />
                  </div>
                </div>
                {data.products.total > 0 && (
                  <div className="rounded-xl bg-stone-50 p-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Live on storefront</span>
                      <span className="font-semibold tabular text-ink">
                        {Math.round((data.products.active / data.products.total) * 100)}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-200" aria-hidden>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#FF8A55] to-brand"
                        style={{ width: `${(data.products.active / data.products.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="grid animate-enter grid-cols-1 gap-5 xl:grid-cols-3">
            <Card className="min-w-0 xl:col-span-2">
              <CardHeader
                title="Recent orders"
                description="Latest orders from the storefront"
                action={
                  <Link href="/orders" className={buttonClasses({ variant: 'ghost', size: 'xs' })}>
                    View all <ArrowRight />
                  </Link>
                }
              />
              {data.recentOrders.length === 0 ? (
                <EmptyState icon={ShoppingBag} title="No orders yet" description="New orders from the storefront will show up here." />
              ) : (
                <ul className="divide-y divide-line/80">
                  {data.recentOrders.map((o) => (
                    <li key={o.id}>
                      <Link
                        href={`/orders/${o.id}`}
                        className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-stone-50/80 sm:px-5"
                      >
                        <InitialsAvatar name={o.customerName} size={36} />
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
                          <p className="font-display text-sm font-bold tabular">{formatCurrency(o.total)}</p>
                          <p className="text-xs text-muted">
                            {o.itemsCount} item{o.itemsCount === 1 ? '' : 's'}
                          </p>
                        </div>
                        <ArrowRight className="hidden size-4 text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-stone-500 sm:block" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="min-w-0">
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
                <ul className="divide-y divide-line/80">
                  {data.lowStockProducts.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/products/${p.id}`}
                        className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-stone-50/80 sm:px-5"
                      >
                        <Thumb src={p.thumbnailUrl} alt={p.name} size={40} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium">{p.name}</p>
                          <p className="truncate text-xs text-muted">{p.sku ? `SKU ${p.sku}` : 'No SKU'}</p>
                        </div>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-semibold tabular ring-1 ring-inset',
                            p.stock === 0 ? 'bg-red-50 text-red-700 ring-red-600/15' : 'bg-amber-50 text-amber-800 ring-amber-600/20',
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
