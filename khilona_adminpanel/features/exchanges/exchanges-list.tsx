'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, MessageCircle, PackageOpen, PackageX, Phone, RefreshCcw, Search, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Card, EmptyState, ErrorState, Skeleton, Thumb } from '@/components/ui/feedback';
import { Field } from '@/components/ui/field';
import { Input, Select, Textarea } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { Tabs } from '@/components/ui/tabs';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { useUrlState } from '@/hooks/use-url-state';
import { getErrorMessage } from '@/lib/api-client';
import { qk } from '@/lib/query-keys';
import { exchangeService } from '@/services';
import { EXCHANGE_STATUSES, type AdminExchange, type ExchangeReason, type ExchangeStatus } from '@/types/api';
import { cn } from '@/utils/cn';
import { formatCurrency, formatDate, formatDateTime, formatPhone, formatRelative } from '@/utils/format';

const KEYS = ['status', 'search', 'sort', 'page'] as const;

export const EXCHANGE_STATUS_LABEL: Record<ExchangeStatus, string> = {
  REQUESTED: 'Requested',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
};
export const EXCHANGE_STATUS_TONE: Record<ExchangeStatus, 'warning' | 'info' | 'danger' | 'success'> = {
  REQUESTED: 'warning',
  APPROVED: 'info',
  REJECTED: 'danger',
  COMPLETED: 'success',
};
export const EXCHANGE_REASON_LABEL: Record<ExchangeReason, string> = {
  WRONG_ITEM: 'Wrong item received',
  DAMAGED_ITEM: 'Broken / damaged item',
};
const ACTION_LABEL: Record<ExchangeStatus, string> = {
  REQUESTED: 'Requested',
  APPROVED: 'Approve exchange',
  REJECTED: 'Reject',
  COMPLETED: 'Mark as exchanged',
};

export function ExchangeReasonIcon({ reason, className }: { reason: ExchangeReason; className?: string }) {
  const Icon = reason === 'WRONG_ITEM' ? PackageOpen : PackageX;
  return <Icon className={className} aria-hidden />;
}

function ManageDialog({ exchange, onClose }: { exchange: AdminExchange; onClose: () => void }) {
  const qc = useQueryClient();
  const [note, setNote] = useState(exchange.adminNote ?? '');
  const [target, setTarget] = useState<ExchangeStatus | null>(null);
  const [touched, setTouched] = useState(false);
  const noteRequired = target === 'REJECTED';
  const invalid = noteRequired && note.trim().length < 3;

  const m = useMutation({
    mutationFn: () =>
      exchangeService.update(exchange.id, {
        ...(target ? { status: target } : {}),
        adminNote: note.trim() || null,
      }),
    onSuccess: (updated) => {
      void qc.invalidateQueries({ queryKey: qk.exchanges.all });
      void qc.invalidateQueries({ queryKey: qk.orders.all });
      toast.success(target ? `Exchange ${EXCHANGE_STATUS_LABEL[updated.status].toLowerCase()}` : 'Note saved');
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Could not update the exchange')),
  });

  return (
    <Dialog
      open
      onClose={onClose}
      dismissible={!m.isPending}
      size="md"
      title={
        <span className="flex flex-wrap items-center gap-2">
          Exchange {exchange.requestNumber}
          <Badge tone={EXCHANGE_STATUS_TONE[exchange.status]}>{EXCHANGE_STATUS_LABEL[exchange.status]}</Badge>
        </span>
      }
      description={`Order ${exchange.order.orderNumber} · requested ${formatDateTime(exchange.createdAt)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={m.isPending}>
            Close
          </Button>
          <Button
            variant={target === 'REJECTED' ? 'danger' : 'primary'}
            loading={m.isPending}
            onClick={() => {
              setTouched(true);
              if (!invalid) m.mutate();
            }}
            disabled={!target && note.trim() === (exchange.adminNote ?? '')}
          >
            {target ? ACTION_LABEL[target] : 'Save note'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-3 rounded-xl bg-stone-50 p-3">
          <Thumb src={exchange.item.imageUrl} alt={exchange.item.productName} size={56} className="rounded-lg" />
          <div className="min-w-0 text-[13px]">
            <p className="font-semibold">{exchange.item.productName}</p>
            {exchange.item.variantTitle && <p className="text-muted">{exchange.item.variantTitle}</p>}
            <p className="mt-0.5 text-muted tabular">
              Exchange {exchange.quantity} of {exchange.item.quantity} · {formatCurrency(exchange.item.unitPrice)} each
              {exchange.item.sku ? ` · SKU ${exchange.item.sku}` : ''}
            </p>
          </div>
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-[13px] font-semibold">
            <ExchangeReasonIcon reason={exchange.reason} className="size-4 text-muted" />
            {EXCHANGE_REASON_LABEL[exchange.reason]}
          </p>
          <p className="mt-1.5 whitespace-pre-line rounded-xl border border-line px-3 py-2.5 text-[13px] leading-relaxed text-ink-soft">{exchange.details}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {exchange.customer.callUrl && (
            <a href={exchange.customer.callUrl} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-medium hover:bg-stone-50">
              <Phone className="size-3.5" aria-hidden /> {exchange.customer.name} · {formatPhone(exchange.customer.phone)}
            </a>
          )}
          {exchange.customer.whatsappUrl && (
            <a
              href={exchange.customer.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-medium hover:bg-stone-50"
            >
              <MessageCircle className="size-3.5" aria-hidden /> WhatsApp (ask for photos)
            </a>
          )}
        </div>

        {exchange.allowedTransitions.length > 0 ? (
          <fieldset>
            <legend className="mb-2 text-[13px] font-medium">Update status</legend>
            <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
              {exchange.allowedTransitions.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={target === s}
                  onClick={() => setTarget(target === s ? null : s)}
                  className={cn(
                    'flex h-10 items-center gap-2 rounded-xl border px-3 text-left text-[13px] font-medium transition-all',
                    target === s
                      ? s === 'REJECTED'
                        ? 'border-danger/60 bg-danger-tint text-red-800 ring-4 ring-danger/10'
                        : 'border-brand/60 bg-brand-tint ring-4 ring-brand/10'
                      : 'border-line hover:border-line-strong hover:bg-stone-50',
                  )}
                >
                  {s === 'REJECTED' ? <XCircle className="size-4 text-danger" aria-hidden /> : <CheckCircle2 className="size-4 text-success" aria-hidden />}
                  {ACTION_LABEL[s]}
                </button>
              ))}
            </div>
          </fieldset>
        ) : (
          <p className="rounded-xl border border-line bg-stone-50 px-3 py-2.5 text-[13px] text-muted">
            This request is {EXCHANGE_STATUS_LABEL[exchange.status].toLowerCase()}
            {exchange.resolvedAt ? ` (${formatDate(exchange.resolvedAt)}${exchange.handledByName ? `, by ${exchange.handledByName}` : ''})` : ''}. You can still update the note.
          </p>
        )}

        <Field
          label={noteRequired ? 'Reason for rejecting (required)' : 'Note for the customer'}
          hint="Shown to the customer on their order page."
          error={touched && invalid ? 'Explain why the exchange is rejected' : undefined}
        >
          <Textarea
            rows={3}
            maxLength={1000}
            value={note}
            invalid={touched && invalid}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              target === 'APPROVED'
                ? 'e.g. Our delivery partner will pick it up tomorrow and bring the replacement.'
                : target === 'REJECTED'
                  ? 'e.g. The product shows signs of use; damage is not covered.'
                  : 'e.g. Replacement delivered on 12 Nov.'
            }
          />
        </Field>
      </div>
    </Dialog>
  );
}

function ExchangeRow({ exchange, onOpen }: { exchange: AdminExchange; onOpen: () => void }) {
  return (
    <li>
      <button type="button" onClick={onOpen} className="flex w-full flex-col gap-3 p-4 text-left transition-colors hover:bg-stone-50/70 sm:flex-row sm:items-start sm:gap-4 sm:p-5">
        <Thumb src={exchange.item.imageUrl} alt={exchange.item.productName} size={52} className="rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-semibold tabular">{exchange.requestNumber}</span>
            <Badge tone={EXCHANGE_STATUS_TONE[exchange.status]}>{EXCHANGE_STATUS_LABEL[exchange.status]}</Badge>
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <ExchangeReasonIcon reason={exchange.reason} className="size-3.5" />
              {EXCHANGE_REASON_LABEL[exchange.reason]}
            </span>
          </div>
          <p className="mt-1 truncate text-sm font-medium text-ink">
            {exchange.item.productName}
            {exchange.quantity > 1 && <span className="text-muted"> × {exchange.quantity}</span>}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">“{exchange.details}”</p>
          <p className="mt-1.5 text-xs text-muted">
            {exchange.customer.name} · {formatPhone(exchange.customer.phone)} · Order{' '}
            <span className="font-medium text-ink">{exchange.order.orderNumber}</span> · {formatRelative(exchange.createdAt)}
          </p>
        </div>
        <span className="shrink-0 self-center text-xs font-semibold text-brand max-sm:hidden">Manage →</span>
      </button>
    </li>
  );
}

export function ExchangesList() {
  const { values, set } = useUrlState(KEYS);
  const status = (EXCHANGE_STATUSES as readonly string[]).includes(values.status ?? '') ? (values.status as ExchangeStatus) : undefined;
  const sort = values.sort === 'oldest' ? 'oldest' : 'newest';
  const page = Math.max(1, Number(values.page) || 1);
  const [searchInput, setSearchInput] = useState(values.search ?? '');
  const debounced = useDebouncedValue(searchInput, 350);
  const [openId, setOpenId] = useState<string | null>(null);
  useEffect(() => {
    if ((values.search ?? '') !== debounced.trim()) set({ search: debounced.trim() || undefined, page: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const params = useMemo(() => ({ status, search: values.search, sort, page, limit: 20 }) as const, [status, values.search, sort, page]);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.exchanges.list(params),
    queryFn: () => exchangeService.list(params),
    placeholderData: keepPreviousData,
  });
  const counts = useQuery({ queryKey: qk.exchanges.counts, queryFn: exchangeService.statusCounts });
  const tabs = [
    { value: 'ALL', label: 'All', count: counts.data?.ALL },
    ...EXCHANGE_STATUSES.map((s) => ({ value: s, label: EXCHANGE_STATUS_LABEL[s], count: counts.data?.[s] })),
  ];
  const open = data?.items.find((e) => e.id === openId) ?? null;

  return (
    <>
      <PageHeader
        title="Exchanges"
        description="Exchange-only requests for wrong or damaged items, raised by customers after delivery. Each product can be exchanged once."
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Exchanges' }]}
        actions={
          <Link href="/store#exchanges" className="text-[13px] font-medium text-brand hover:text-brand-hover">
            Exchange window settings
          </Link>
        }
      />
      <Tabs label="Filter exchanges by status" items={tabs} value={status ?? 'ALL'} onChange={(v) => set({ status: v === 'ALL' ? undefined : v, page: undefined })} className="mb-4" />
      <Card>
        <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:items-center sm:p-4">
          <Input
            type="search"
            aria-label="Search exchanges"
            placeholder="Search request no., order no., customer, phone or product"
            leading={<Search />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="sm:max-w-md sm:flex-1"
          />
          <Select aria-label="Sort" value={sort} onChange={(e) => set({ sort: e.target.value === 'newest' ? undefined : e.target.value })} wrapperClassName="sm:ml-auto sm:w-44">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </Select>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={RefreshCcw}
            title={status || values.search ? 'No matching exchange requests' : 'No exchange requests yet'}
            description="Customers can request an exchange from their order page after delivery, if they receive a wrong or broken item."
          />
        ) : (
          <>
            <ul className="divide-y divide-line">
              {data.items.map((e) => (
                <ExchangeRow key={e.id} exchange={e} onOpen={() => setOpenId(e.id)} />
              ))}
            </ul>
            <Pagination meta={data.meta} onPageChange={(p) => set({ page: p > 1 ? String(p) : undefined })} noun="requests" />
          </>
        )}
      </Card>
      {open && <ManageDialog key={open.id + open.updatedAt} exchange={open} onClose={() => setOpenId(null)} />}
    </>
  );
}
