'use client';

import { CalendarDays, Eye, MessageCircle, MoreHorizontal, Phone, Search, ShoppingBag, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, type MenuEntry } from '@/components/ui/dropdown-menu';
import { Card, EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { Input, Select } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { Tabs } from '@/components/ui/tabs';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { useUrlState } from '@/hooks/use-url-state';
import { getErrorMessage } from '@/lib/api-client';
import { ORDER_STATUSES, type AdminOrderListItem, type OrderSort, type OrderStatus } from '@/types/api';
import { formatCurrency, formatDate, formatPhone, formatTime } from '@/utils/format';
import { CONFIRM_REQUIRED_STATUSES, ORDER_STATUS_LABEL, ORDER_STATUS_STYLE, ORDER_TRANSITIONS } from '@/utils/status';
import { telLink, whatsappLink } from '@/utils/url';
import { useOrders, useOrderStatusCounts, useUpdateOrderStatus } from './hooks';
import { StatusChangeDialog, type PendingStatusChange } from './status-change-dialog';

const KEYS = ['status', 'search', 'from', 'to', 'sort', 'page'] as const;
const SORTS: { value: OrderSort; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'total_desc', label: 'Highest total' },
  { value: 'total_asc', label: 'Lowest total' },
];

function isStatus(v: string | undefined): v is OrderStatus {
  return !!v && (ORDER_STATUSES as readonly string[]).includes(v);
}

function makeRowActions(onChange: (order: AdminOrderListItem, to: OrderStatus) => void) {
  return (order: AdminOrderListItem): MenuEntry[] => {
    const transitions = ORDER_TRANSITIONS[order.status];
    const entries: MenuEntry[] = [
      { label: 'View details', icon: <Eye />, href: `/orders/${order.id}` },
      { label: 'Call customer', icon: <Phone />, href: telLink(order.customerPhone) },
      {
        label: 'WhatsApp',
        icon: <MessageCircle />,
        href: whatsappLink(order.customerPhone, `Hello ${order.customerName}, this is White Monkey Toys about your order ${order.orderNumber}.`),
      },
    ];
    if (transitions.length) {
      entries.push({ type: 'separator' }, { type: 'label', label: 'Change status' });
      for (const t of transitions) {
        entries.push({
          label: ORDER_STATUS_LABEL[t],
          icon: <span className={`ml-1 mr-1 size-2 rounded-full ${ORDER_STATUS_STYLE[t].dot}`} aria-hidden />,
          danger: t === 'CANCELLED',
          onSelect: () => onChange(order, t),
        });
      }
    }
    return entries;
  };
}

export function OrdersList() {
  const router = useRouter();
  const { values, set, reset } = useUrlState(KEYS);
  const status = isStatus(values.status) ? values.status : undefined;
  const sort = (SORTS.some((s) => s.value === values.sort) ? values.sort : 'newest') as OrderSort;
  const page = Math.max(1, Number(values.page) || 1);

  const [searchInput, setSearchInput] = useState(values.search ?? '');
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  useEffect(() => {
    if ((values.search ?? '') !== debouncedSearch.trim()) set({ search: debouncedSearch.trim() || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);
  useEffect(() => {
    // keep input in sync when URL changes externally (back button / reset)
    setSearchInput((cur) => (cur.trim() === (values.search ?? '') ? cur : values.search ?? ''));
  }, [values.search]);

  const params = useMemo(
    () => ({ status, search: values.search, from: values.from, to: values.to, sort, page, limit: 20 }),
    [status, values.search, values.from, values.to, sort, page],
  );
  const { data, isLoading, isError, error, refetch, isFetching } = useOrders(params);
  const { data: counts } = useOrderStatusCounts();
  const updateStatus = useUpdateOrderStatus();
  const [pendingChange, setPendingChange] = useState<PendingStatusChange | null>(null);

  const requestChange = (order: AdminOrderListItem, to: OrderStatus) => {
    const change = { orderId: order.id, orderNumber: order.orderNumber, from: order.status, to };
    if (CONFIRM_REQUIRED_STATUSES.includes(to)) setPendingChange(change);
    else updateStatus.mutate({ id: order.id, status: to });
  };
  const rowActions = makeRowActions(requestChange);

  const hasFilters = !!(values.search || values.from || values.to || status);
  const tabItems = [
    { value: 'ALL', label: 'All', count: counts?.ALL },
    ...ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s], count: counts?.[s], dotClass: ORDER_STATUS_STYLE[s].dot })),
  ];

  const items = data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Orders"
        description="Confirm, prepare and deliver customer orders. Cash on delivery."
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Orders' }]}
      />

      <Tabs
        label="Filter orders by status"
        items={tabItems}
        value={status ?? 'ALL'}
        onChange={(v) => set({ status: v === 'ALL' ? undefined : v })}
        className="mb-4"
      />

      <Card>
        <div className="flex flex-col gap-2 border-b border-line p-3 sm:p-4 xl:flex-row xl:items-center">
          <Input
            type="search"
            aria-label="Search orders"
            placeholder="Search order no., name or phone"
            leading={<Search />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="xl:max-w-xs xl:flex-1"
          />
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <label className="flex min-w-0 items-center gap-2 text-xs text-muted">
              <CalendarDays className="hidden size-4 sm:block" aria-hidden />
              <span className="sr-only sm:not-sr-only">From</span>
              <Input
                type="date"
                aria-label="From date"
                value={values.from ?? ''}
                max={values.to || undefined}
                onChange={(e) => set({ from: e.target.value || undefined })}
                className="min-w-0 sm:w-[150px]"
              />
            </label>
            <label className="flex min-w-0 items-center gap-2 text-xs text-muted">
              <span className="sr-only sm:not-sr-only">To</span>
              <Input
                type="date"
                aria-label="To date"
                value={values.to ?? ''}
                min={values.from || undefined}
                onChange={(e) => set({ to: e.target.value || undefined })}
                className="min-w-0 sm:w-[150px]"
              />
            </label>
            <Select
              aria-label="Sort orders"
              value={sort}
              onChange={(e) => set({ sort: e.target.value === 'newest' ? undefined : e.target.value })}
              wrapperClassName="col-span-2 sm:col-span-1 sm:w-40"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="col-span-2 sm:col-span-1"
                onClick={() => {
                  setSearchInput('');
                  reset();
                }}
              >
                <X />
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
        ) : items.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={Search}
              title="No matching orders"
              description="Try a different search, status or date range."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchInput('');
                    reset();
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState icon={ShoppingBag} title="No orders yet" description="Orders placed on the storefront will appear here." />
          )
        ) : (
          <div className={isFetching ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
            {/* Desktop table */}
            <div className="hidden xl:block">
              <Table>
                <THead>
                  <tr>
                    <TH>Order</TH>
                    <TH>Customer</TH>
                    <TH>City</TH>
                    <TH>Items</TH>
                    <TH className="text-right">Total</TH>
                    <TH>Status</TH>
                    <TH>Payment</TH>
                    <TH className="w-12">
                      <span className="sr-only">Actions</span>
                    </TH>
                  </tr>
                </THead>
                <TBody>
                  {items.map((o) => (
                    <TR key={o.id} className="cursor-pointer" onClick={(e) => {
                      if ((e.target as HTMLElement).closest('a,button')) return;
                      router.push(`/orders/${o.id}`);
                    }}>
                      <TD>
                        <Link href={`/orders/${o.id}`} className="whitespace-nowrap font-semibold text-ink tabular hover:text-brand">
                          {o.orderNumber}
                        </Link>
                        <p className="whitespace-nowrap text-xs text-muted tabular">
                          {formatDate(o.createdAt)} · {formatTime(o.createdAt)}
                        </p>
                      </TD>
                      <TD>
                        <p className="max-w-[180px] truncate font-medium">{o.customerName}</p>
                        <a href={telLink(o.customerPhone)} className="text-xs text-muted tabular hover:text-brand">
                          {formatPhone(o.customerPhone)}
                        </a>
                      </TD>
                      <TD className="max-w-[120px] truncate text-ink-soft">{o.city}</TD>
                      <TD>
                        <p className="max-w-[240px] truncate text-ink-soft" title={o.itemsPreview.join(', ')}>
                          {o.itemsPreview.join(', ')}
                        </p>
                        <p className="text-xs text-muted">
                          {o.itemsCount} item{o.itemsCount === 1 ? '' : 's'}
                        </p>
                      </TD>
                      <TD className="text-right font-semibold tabular">{formatCurrency(o.total)}</TD>
                      <TD>
                        <OrderStatusBadge status={o.status} />
                      </TD>
                      <TD>
                        <PaymentStatusBadge status={o.paymentStatus} />
                      </TD>
                      <TD>
                        <DropdownMenu
                          label={`Actions for order ${o.orderNumber}`}
                          trigger={<MoreHorizontal />}
                          items={rowActions(o)}
                        />
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>

            {/* Mobile / tablet cards */}
            <ul className="divide-y divide-line xl:hidden">
              {items.map((o) => (
                <li key={o.id} className="flex gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/orders/${o.id}`} className="text-sm font-semibold tabular hover:text-brand">
                        {o.orderNumber}
                      </Link>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <p className="mt-1 truncate text-[13px] font-medium">
                      {o.customerName} <span className="font-normal text-muted">· {o.city}</span>
                    </p>
                    <p className="truncate text-xs text-muted">{o.itemsPreview.join(', ')}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span className="text-sm font-semibold text-ink tabular">{formatCurrency(o.total)}</span>
                      <PaymentStatusBadge status={o.paymentStatus} />
                      <span className="tabular">
                        {formatDate(o.createdAt)}, {formatTime(o.createdAt)}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <a
                        href={telLink(o.customerPhone)}
                        className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-line text-[13px] font-medium hover:bg-subtle"
                        aria-label={`Call ${o.customerName}`}
                      >
                        <Phone className="size-4" aria-hidden /> Call
                      </a>
                      <a
                        href={whatsappLink(o.customerPhone, `Hello ${o.customerName}, this is White Monkey Toys about your order ${o.orderNumber}.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-line text-[13px] font-medium hover:bg-subtle"
                        aria-label={`WhatsApp ${o.customerName}`}
                      >
                        <MessageCircle className="size-4" aria-hidden /> WhatsApp
                      </a>
                      <Link
                        href={`/orders/${o.id}`}
                        className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink text-[13px] font-medium text-white hover:bg-ink-soft"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <DropdownMenu label={`Actions for order ${o.orderNumber}`} trigger={<MoreHorizontal />} items={rowActions(o)} />
                  </div>
                </li>
              ))}
            </ul>
            {data && <Pagination meta={data.meta} noun="orders" onPageChange={(p) => set({ page: p > 1 ? String(p) : undefined })} />}
          </div>
        )}
      </Card>

      <StatusChangeDialog change={pendingChange} onClose={() => setPendingChange(null)} />
    </>
  );
}

function ListSkeleton() {
  return (
    <ul className="divide-y divide-line" aria-busy="true" aria-label="Loading orders">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 px-4 py-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
          <Skeleton className="hidden h-5 w-20 sm:block" />
          <Skeleton className="h-4 w-16" />
        </li>
      ))}
    </ul>
  );
}
