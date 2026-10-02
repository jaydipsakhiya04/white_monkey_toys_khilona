'use client';

import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  StickyNote,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/ui/badge';
import { Button, buttonClasses } from '@/components/ui/button';
import { Card, CardHeader, ErrorState, Skeleton, Thumb } from '@/components/ui/feedback';
import { Field } from '@/components/ui/field';
import { Select, Textarea } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { getErrorMessage, isApiError } from '@/lib/api-client';
import { PAYMENT_STATUSES, type AdminOrderDetail, type OrderStatus, type PaymentStatus } from '@/types/api';
import { cn } from '@/utils/cn';
import { formatCurrency, formatDateTime, formatPhone, formatRelative } from '@/utils/format';
import {
  CONFIRM_REQUIRED_STATUSES,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_STYLE,
  PAYMENT_STATUS_LABEL,
} from '@/utils/status';
import { telLink } from '@/utils/url';
import { useOrder, useUpdateOrder, useUpdateOrderStatus } from './hooks';
import { StatusChangeDialog, type PendingStatusChange } from './status-change-dialog';

function ContactButton({
  href,
  icon: Icon,
  label,
  sub,
  external,
  tone = 'neutral',
}: {
  href: string | null;
  icon: typeof Phone;
  label: string;
  sub?: string;
  external?: boolean;
  tone?: 'neutral' | 'green' | 'brand';
}) {
  const toneCls =
    tone === 'green'
      ? 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'
      : tone === 'brand'
        ? 'text-brand-hover bg-brand-tint border-orange-200 hover:bg-orange-100'
        : 'text-ink bg-surface border-line hover:bg-subtle';
  if (!href)
    return (
      <span className="flex min-h-14 flex-1 cursor-not-allowed flex-col items-center justify-center gap-0.5 rounded-xl border border-dashed border-line px-2 text-center text-stone-400">
        <Icon className="size-5" aria-hidden />
        <span className="text-xs font-medium">{label}</span>
        <span className="sr-only">(not available)</span>
      </span>
    );
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={cn(
        'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-2 text-center transition-colors sm:flex-row sm:gap-2',
        toneCls,
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <span className="flex flex-col sm:items-start">
        <span className="text-[13px] font-semibold">{label}</span>
        {sub && <span className="hidden text-[11px] font-normal opacity-80 tabular sm:block">{sub}</span>}
      </span>
    </a>
  );
}

function StatusPanel({ order }: { order: AdminOrderDetail }) {
  const [target, setTarget] = useState<OrderStatus | null>(order.allowedTransitions[0] ?? null);
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState<PendingStatusChange | null>(null);
  const mutation = useUpdateOrderStatus();

  useEffect(() => {
    setTarget(order.allowedTransitions[0] ?? null);
  }, [order.status, order.allowedTransitions]);

  const submit = () => {
    if (!target) return;
    if (CONFIRM_REQUIRED_STATUSES.includes(target)) {
      setConfirm({ orderId: order.id, orderNumber: order.orderNumber, from: order.status, to: target });
      return;
    }
    mutation.mutate(
      { id: order.id, status: target, note: note.trim() || undefined },
      { onSuccess: () => setNote('') },
    );
  };

  return (
    <Card>
      <CardHeader title="Update status" description={`Currently ${ORDER_STATUS_LABEL[order.status].toLowerCase()}`} />
      <div className="p-4 sm:p-5">
        {order.allowedTransitions.length === 0 ? (
          <div className="rounded-lg border border-line bg-page px-3 py-3 text-[13px] text-ink-soft">
            <p className="font-medium text-ink">This order is {ORDER_STATUS_LABEL[order.status].toLowerCase()}.</p>
            <p className="mt-0.5 text-muted">
              It&apos;s a final status, so no further changes are possible.
              {order.status === 'CANCELLED' && order.stockRestored && ' Stock has been returned to inventory.'}
            </p>
          </div>
        ) : (
          <>
            <fieldset>
              <legend className="mb-2 text-[13px] font-medium">Move order to</legend>
              <div role="radiogroup" aria-label="New status" className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {order.allowedTransitions.map((s) => {
                  const selected = target === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setTarget(s)}
                      className={cn(
                        'flex h-11 items-center gap-2.5 rounded-lg border px-3 text-left text-[13px] font-medium transition-colors',
                        selected
                          ? s === 'CANCELLED'
                            ? 'border-danger bg-danger-tint text-red-800 ring-3 ring-danger/10'
                            : 'border-brand bg-brand-tint text-ink ring-3 ring-brand/10'
                          : 'border-line hover:bg-subtle',
                      )}
                    >
                      <span className={cn('size-2 shrink-0 rounded-full', ORDER_STATUS_STYLE[s].dot)} aria-hidden />
                      <span className="flex-1">{ORDER_STATUS_LABEL[s]}</span>
                      {selected && <Check className="size-4 text-brand" aria-hidden />}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <Field label="Note (optional)" className="mt-4" hint="Visible in the order timeline for your team.">
              <Textarea rows={2} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Packed and ready for pickup" />
            </Field>
            <Button
              className="mt-4 w-full"
              size="lg"
              variant={target === 'CANCELLED' ? 'danger' : 'primary'}
              onClick={submit}
              disabled={!target}
              loading={mutation.isPending}
            >
              {target ? `Mark as ${ORDER_STATUS_LABEL[target].toLowerCase()}` : 'Choose a status'}
            </Button>
          </>
        )}
      </div>
      <StatusChangeDialog
        key={confirm ? `${confirm.to}-${note}` : 'none'}
        change={confirm}
        initialNote={note}
        onClose={() => setConfirm(null)}
        onDone={() => setNote('')}
      />
    </Card>
  );
}

function PaymentAndNotes({ order }: { order: AdminOrderDetail }) {
  const update = useUpdateOrder();
  const [adminNote, setAdminNote] = useState(order.adminNote ?? '');
  useEffect(() => setAdminNote(order.adminNote ?? ''), [order.adminNote]);
  const noteDirty = (order.adminNote ?? '') !== adminNote;

  const changePayment = (paymentStatus: PaymentStatus) => {
    update.mutate(
      { id: order.id, paymentStatus },
      {
        onSuccess: () => toast.success(`Payment marked as ${PAYMENT_STATUS_LABEL[paymentStatus].toLowerCase()}`),
        onError: (err) => toast.error(getErrorMessage(err, 'Could not update payment status')),
      },
    );
  };

  const saveNote = () => {
    update.mutate(
      { id: order.id, adminNote: adminNote.trim() || null },
      {
        onSuccess: () => toast.success('Internal note saved'),
        onError: (err) => toast.error(getErrorMessage(err, 'Could not save the note')),
      },
    );
  };

  return (
    <Card>
      <CardHeader title="Payment & notes" />
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <Field label="Payment status" hint="Cash on delivery">
          <Select
            value={order.paymentStatus}
            disabled={update.isPending}
            onChange={(e) => changePayment(e.target.value as PaymentStatus)}
          >
            {PAYMENT_STATUSES.map((p) => (
              <option key={p} value={p}>
                {PAYMENT_STATUS_LABEL[p]}
              </option>
            ))}
          </Select>
        </Field>
        {order.customerNote && (
          <div>
            <p className="mb-1.5 text-[13px] font-medium">Customer note</p>
            <p className="whitespace-pre-wrap rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-950">
              {order.customerNote}
            </p>
          </div>
        )}
        <Field label="Internal note" hint="Only visible to admins.">
          <Textarea
            rows={3}
            value={adminNote}
            maxLength={2000}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="e.g. Customer prefers delivery after 6 pm"
          />
        </Field>
        <div className="flex justify-end gap-2">
          {noteDirty && (
            <Button variant="ghost" size="sm" onClick={() => setAdminNote(order.adminNote ?? '')}>
              Discard
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={saveNote} disabled={!noteDirty} loading={update.isPending && noteDirty}>
            <StickyNote />
            Save note
          </Button>
        </div>
      </div>
    </Card>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error('Could not copy to clipboard');
        }
      }}
      aria-label={label}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading order">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-7 w-56" />
      <div className="mt-5 grid grid-cols-3 gap-2">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

export function OrderDetail({ id }: { id: string }) {
  const { data: order, isLoading, isError, error, refetch } = useOrder(id);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !order) {
    const notFound = isApiError(error) && error.status === 404;
    return (
      <Card>
        <ErrorState
          title={notFound ? 'Order not found' : "Couldn't load this order"}
          message={notFound ? 'It may have been removed or the link is wrong.' : getErrorMessage(error)}
          onRetry={notFound ? undefined : () => void refetch()}
        />
        <div className="flex justify-center pb-8">
          <Link href="/orders" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
            <ArrowLeft /> Back to orders
          </Link>
        </div>
      </Card>
    );
  }

  const fullAddress = [order.address, order.landmark ? `Near ${order.landmark}` : null, order.city, `${order.state} ${order.pincode}`]
    .filter(Boolean)
    .join(', ');
  const mapsUrl = order.contact.mapsUrl ?? order.googleMapsLink ?? order.locationLink;
  const coordsUrl =
    order.latitude !== null && order.longitude !== null
      ? `https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`
      : null;
  const history = [...order.history].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Orders', href: '/orders' },
          { label: order.orderNumber },
        ]}
        title={<span className="tabular">{order.orderNumber}</span>}
        meta={
          <>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </>
        }
        description={
          <>
            Placed {formatDateTime(order.createdAt)} <span className="text-stone-400">·</span> {formatRelative(order.createdAt)}
          </>
        }
        actions={
          <Link href="/orders" className={buttonClasses({ variant: 'secondary', size: 'sm', className: 'max-sm:hidden' })}>
            <ArrowLeft /> All orders
          </Link>
        }
      />

      <div className="mb-4 flex gap-2">
        <ContactButton href={order.contact.callUrl} icon={Phone} label="Call" sub={formatPhone(order.customerPhone)} tone="brand" />
        <ContactButton href={order.contact.whatsappUrl} icon={MessageCircle} label="WhatsApp" sub="Chat with customer" external tone="green" />
        <ContactButton href={mapsUrl ?? coordsUrl} icon={Navigation} label="Location" sub={order.city} external />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Right column first on mobile (status & customer are what you need on the move) */}
        <div className="order-first flex flex-col gap-4 lg:order-none lg:col-start-2 lg:row-start-1">
          <StatusPanel order={order} />

          <Card>
            <CardHeader title="Customer" />
            <div className="flex flex-col gap-3 p-4 text-[13px] sm:p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-subtle text-muted">
                  <UserRound className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{order.customerName}</p>
                  <Link
                    href={`/orders?search=${encodeURIComponent(order.customerPhone)}`}
                    className="text-xs text-brand hover:text-brand-hover"
                  >
                    {order.customerOrdersCount} order{order.customerOrdersCount === 1 ? '' : 's'} from this customer
                  </Link>
                  {order.linkedToAccount ? (
                    <p className="mt-1 text-xs font-medium text-green-700">Placed from a customer account</p>
                  ) : order.customerHasAccount ? (
                    <p className="mt-1 text-xs text-muted">Guest order · this mobile has an account</p>
                  ) : (
                    <p className="mt-1 text-xs text-muted">Guest checkout</p>
                  )}
                </div>
              </div>
              <dl className="grid grid-cols-[90px_minmax(0,1fr)] gap-x-3 gap-y-2">
                <dt className="text-muted">Phone</dt>
                <dd>
                  <a href={order.contact.callUrl} className="font-medium tabular hover:text-brand">
                    {formatPhone(order.customerPhone)}
                  </a>
                </dd>
                {order.alternatePhone && (
                  <>
                    <dt className="text-muted">Alternate</dt>
                    <dd>
                      <a href={order.contact.alternateCallUrl ?? telLink(order.alternatePhone)} className="font-medium tabular hover:text-brand">
                        {formatPhone(order.alternatePhone)}
                      </a>
                    </dd>
                  </>
                )}
                {order.customerEmail && (
                  <>
                    <dt className="text-muted">Email</dt>
                    <dd className="min-w-0">
                      <a href={`mailto:${order.customerEmail}`} className="inline-flex max-w-full items-center gap-1 truncate hover:text-brand">
                        <Mail className="size-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{order.customerEmail}</span>
                      </a>
                    </dd>
                  </>
                )}
              </dl>
            </div>
          </Card>

          <Card>
            <CardHeader title="Delivery address" action={<CopyButton text={fullAddress} label="Copy address" />} />
            <div className="flex flex-col gap-3 p-4 text-[13px] sm:p-5">
              <div className="flex gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                <address className="not-italic leading-relaxed">
                  {order.address}
                  {order.landmark && (
                    <>
                      <br />
                      <span className="text-muted">Landmark:</span> {order.landmark}
                    </>
                  )}
                  <br />
                  {order.city}, {order.state} – <span className="tabular">{order.pincode}</span>
                </address>
              </div>
              {(order.googleMapsLink || order.locationLink || coordsUrl || order.contact.mapsUrl) && (
                <div className="flex flex-wrap gap-2">
                  {order.googleMapsLink && (
                    <a href={order.googleMapsLink} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: 'secondary', size: 'xs' })}>
                      <ExternalLink /> Google Maps link
                    </a>
                  )}
                  {order.locationLink && (
                    <a href={order.locationLink} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: 'secondary', size: 'xs' })}>
                      <ExternalLink /> Shared location
                    </a>
                  )}
                  {!order.googleMapsLink && !order.locationLink && order.contact.mapsUrl && (
                    <a href={order.contact.mapsUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: 'secondary', size: 'xs' })}>
                      <ExternalLink /> Open in Maps
                    </a>
                  )}
                  {coordsUrl && (
                    <a href={coordsUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: 'secondary', size: 'xs' })}>
                      <Navigation /> GPS pin
                    </a>
                  )}
                </div>
              )}
              {order.latitude !== null && order.longitude !== null && (
                <p className="text-xs text-muted tabular">
                  Lat {order.latitude.toFixed(6)}, Lng {order.longitude.toFixed(6)}
                </p>
              )}
            </div>
          </Card>

          <PaymentAndNotes order={order} />
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
          <Card>
            <CardHeader title="Items" description={`${order.itemsCount} item${order.itemsCount === 1 ? '' : 's'}`} />
            <ul className="divide-y divide-line">
              {order.items.map((item) => {
                const discounted = item.unitMrp > item.unitPrice;
                return (
                  <li key={item.id} className="flex gap-3 px-4 py-3.5 sm:px-5">
                    <Thumb src={item.imageUrl} alt={item.productName} size={56} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="min-w-0">
                          {item.productId ? (
                            <Link href={`/products/${item.productId}`} className="text-[13px] font-semibold hover:text-brand">
                              {item.productName}
                            </Link>
                          ) : (
                            <p className="text-[13px] font-semibold">{item.productName}</p>
                          )}
                          {item.options.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {item.options.map((o) => (
                                <span key={o.name} className="rounded bg-subtle px-1.5 py-0.5 text-[11px] text-ink-soft">
                                  {o.name}: <span className="font-medium text-ink">{o.value}</span>
                                </span>
                              ))}
                            </div>
                          )}
                          {!item.options.length && item.variantTitle && (
                            <p className="mt-0.5 text-xs text-muted">{item.variantTitle}</p>
                          )}
                          <p className="mt-1 text-xs text-muted">
                            {item.sku ? <span className="tabular">SKU {item.sku}</span> : 'No SKU'}
                            {item.categoryName && <> · {item.categoryName}</>}
                          </p>
                        </div>
                        <div className="flex items-baseline justify-between gap-3 sm:block sm:text-right">
                          <p className="text-xs text-muted tabular">
                            {item.quantity} ×{' '}
                            {discounted && <s className="mr-1 text-stone-400">{formatCurrency(item.unitMrp)}</s>}
                            <span className="text-ink">{formatCurrency(item.unitPrice)}</span>
                          </p>
                          <p className="text-sm font-semibold tabular">{formatCurrency(item.lineTotal)}</p>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <dl className="space-y-1.5 border-t border-line bg-page/60 px-4 py-4 text-[13px] sm:px-5">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="tabular">{formatCurrency(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">Discount</dt>
                  <dd className="text-success tabular">− {formatCurrency(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd className="tabular">{order.shippingFee > 0 ? formatCurrency(order.shippingFee) : 'Free'}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-sm font-semibold">
                <dt>Total</dt>
                <dd className="tabular">{formatCurrency(order.total)}</dd>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <dt>Payment</dt>
                <dd>Cash on delivery · {PAYMENT_STATUS_LABEL[order.paymentStatus]}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Timeline" description="Every status change, newest last" />
            <ol className="px-4 py-4 sm:px-5" aria-label="Order status history">
              {history.map((h, i) => (
                <li key={h.id} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < history.length - 1 && <span className="absolute left-[7px] top-5 h-[calc(100%-12px)] w-px bg-line" aria-hidden />}
                  <span className={cn('relative mt-1 size-[15px] shrink-0 rounded-full border-[3px] border-surface ring-1 ring-line', ORDER_STATUS_STYLE[h.toStatus].dot)} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[13px] font-semibold">{h.fromStatus ? ORDER_STATUS_LABEL[h.toStatus] : 'Order placed'}</span>
                      {h.fromStatus && (
                        <span className="text-xs text-muted">from {ORDER_STATUS_LABEL[h.fromStatus].toLowerCase()}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted">
                      <time dateTime={h.createdAt}>{formatDateTime(h.createdAt)}</time>
                      {' · '}
                      {h.changedByName ? `by ${h.changedByName}` : h.fromStatus ? 'by system' : 'by customer'}
                    </p>
                    {h.note && <p className="mt-1.5 whitespace-pre-wrap rounded-md bg-subtle px-2.5 py-1.5 text-[13px] text-ink-soft">{h.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
