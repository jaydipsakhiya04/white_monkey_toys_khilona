"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, Clock3, Mail, MapPin, PackageOpen, PackageX, Phone, RefreshCcw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/icons/brand";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/field";
import { Dialog } from "@/components/ui/overlay";
import { errorMessage } from "@/lib/api/errors";
import { accountService } from "@/services/account";
import type { CustomerOrder, CustomerOrderItem, ExchangeReason, ExchangeStatus, ExchangeSummary } from "@/types/api";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/format";
import { formatPhone, whatsappLink } from "@/utils/phone";
import { useStoreInfo } from "./account-shell";
import { accountKeys } from "./orders-ui";

export const EXCHANGE_REASONS: { value: ExchangeReason; title: string; body: string; Icon: typeof PackageX }[] = [
  { value: "WRONG_ITEM", title: "Received a wrong item", body: "Different product, model or colour than ordered", Icon: PackageOpen },
  { value: "DAMAGED_ITEM", title: "Item is broken / damaged", body: "Arrived broken, cracked or not working", Icon: PackageX },
];

const STATUS: Record<ExchangeStatus, { label: string; tone: string; text: string }> = {
  REQUESTED: { label: "Exchange requested", tone: "bg-amber-50 text-amber-800 ring-amber-600/20", text: "We'll call or WhatsApp you within 24 hours to arrange the exchange." },
  APPROVED: { label: "Exchange approved", tone: "bg-sky-50 text-sky-800 ring-sky-600/20", text: "Approved — our team will pick up the item and deliver the replacement." },
  REJECTED: { label: "Exchange declined", tone: "bg-danger-tint text-danger-700 ring-danger/20", text: "This request was declined. Contact the store if you have questions." },
  COMPLETED: { label: "Exchanged", tone: "bg-success-tint text-success-700 ring-success/20", text: "The replacement has been delivered." },
};

/** Shop contact details shown with every exchange. */
export function ShopContact({ orderNumber, compact }: { orderNumber: string; compact?: boolean }) {
  const { storeName, phoneUrl, whatsappUrl, contact } = useStoreInfo();
  const wa = whatsappUrl ? whatsappLink(whatsappUrl, `Hi ${storeName}, I need help with an exchange for order ${orderNumber}.`) : null;
  return (
    <div className={cn("rounded-2xl bg-sand p-4", compact && "p-3.5")}>
      <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-muted">Shop contact</p>
      <p className="mt-1 font-semibold text-ink">{storeName}</p>
      <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
        {(contact.numbers?.length ? contact.numbers : contact.phone ? [{ display: formatPhone(contact.phone), telUrl: phoneUrl ?? "", whatsappUrl: "" }] : []).map((n) => (
          <li key={n.telUrl || n.display} className="flex items-center gap-2">
            <Phone className="size-4 shrink-0 text-muted" aria-hidden="true" />
            <a href={n.telUrl || undefined} className="font-medium text-ink hover:underline">
              {n.display}
            </a>
            {n.whatsappUrl && (
              <a href={n.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${n.display}`} className="text-[#128C4A] hover:opacity-80">
                <WhatsAppIcon className="size-4" />
              </a>
            )}
          </li>
        ))}
        {contact.email && (
          <li className="flex items-center gap-2">
            <Mail className="size-4 shrink-0 text-muted" aria-hidden="true" />
            <a href={`mailto:${contact.email}`} className="truncate hover:underline">
              {contact.email}
            </a>
          </li>
        )}
        {contact.addressLines.length > 0 && (
          <li className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
            <span>
              {contact.addressLines.join(", ")}
              {contact.mapUrl && (
                <>
                  {" · "}
                  <a href={contact.mapUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-ink underline-offset-2 hover:underline">
                    Directions
                  </a>
                </>
              )}
            </span>
          </li>
        )}
        {contact.hours && (
          <li className="flex items-center gap-2">
            <Clock3 className="size-4 shrink-0 text-muted" aria-hidden="true" />
            {contact.hours}
          </li>
        )}
      </ul>
      {(wa || phoneUrl) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[0.8125rem] font-semibold text-white hover:bg-ink-soft"
            >
              <WhatsAppIcon className="size-4" /> WhatsApp us
            </a>
          )}
          {phoneUrl && (
            <a
              href={phoneUrl}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-[0.8125rem] font-semibold text-ink hover:border-ink"
            >
              <Phone className="size-3.5" aria-hidden="true" /> Call
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function ExchangeStatusCard({ exchange }: { exchange: ExchangeSummary }) {
  const s = STATUS[exchange.status];
  const reason = EXCHANGE_REASONS.find((r) => r.value === exchange.reason);
  return (
    <div className="mt-3 rounded-2xl border border-line p-3.5 sm:ml-[5.5rem]">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", s.tone)}>
          <RefreshCcw className="size-3" aria-hidden="true" />
          {s.label}
        </span>
        <span className="text-xs text-muted">
          #{exchange.requestNumber} · {formatDate(exchange.createdAt)}
        </span>
      </div>
      <p className="mt-2 text-sm text-ink">
        <span className="font-semibold">{reason?.title ?? exchange.reason}</span>
        {exchange.quantity > 1 && <span className="text-muted"> · {exchange.quantity} pcs</span>}
      </p>
      <p className="mt-0.5 line-clamp-3 text-sm text-muted">“{exchange.details}”</p>
      {exchange.adminNote && (
        <p className="mt-2 rounded-xl bg-sand px-3 py-2 text-sm text-ink">
          <span className="font-semibold">Store update: </span>
          {exchange.adminNote}
        </p>
      )}
      <p className="mt-2 text-xs text-muted">{s.text}</p>
    </div>
  );
}

function ExchangeDialog({ order, item, open, onClose }: { order: CustomerOrder; item: CustomerOrderItem; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState<ExchangeReason | null>(null);
  const [details, setDetails] = useState("");
  const [quantity, setQuantity] = useState(item.quantity);
  const [touched, setTouched] = useState(false);
  const problems = {
    reason: !reason ? "Choose why you need an exchange" : null,
    details: details.trim().length < 10 ? "Describe the problem in a few words (at least 10 characters)" : null,
  };
  const invalid = !!(problems.reason || problems.details);

  const m = useMutation({
    mutationFn: () => accountService.requestExchange(order.orderNumber, { orderItemId: item.id, reason: reason!, details: details.trim(), quantity }),
    onSuccess: (updated) => {
      qc.setQueryData(accountKeys.order(order.orderNumber), updated);
      void qc.invalidateQueries({ queryKey: ["account"] });
      toast.success("Exchange requested — we'll contact you shortly");
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e, "Couldn't request the exchange.")),
  });

  return (
    <Dialog
      open={open}
      onClose={() => !m.isPending && onClose()}
      title="Request an exchange"
      description={`${item.productName}${item.variantTitle ? ` · ${item.variantTitle}` : ""}`}
      className="max-w-lg"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose} disabled={m.isPending}>
            Not now
          </Button>
          <Button
            onClick={() => {
              setTouched(true);
              if (!invalid) m.mutate();
            }}
            loading={m.isPending}
            loadingText="Sending…"
          >
            <RefreshCcw className="size-4" aria-hidden="true" /> Request exchange
          </Button>
        </div>
      }
    >
      <div className="space-y-5 overflow-y-auto px-5 py-4">
        <p className="flex items-start gap-2 rounded-xl bg-accent-tint px-3.5 py-2.5 text-[0.8125rem] text-accent-deep">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Exchange only, for wrong or damaged items. Each product can be exchanged <strong>once</strong>
            {order.exchangeDeadline ? `, until ${formatDate(order.exchangeDeadline)}` : ""}.
          </span>
        </p>

        <fieldset>
          <legend className="text-sm font-semibold text-ink">
            What went wrong? <span className="text-danger-700">*</span>
          </legend>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-2" role="radiogroup">
            {EXCHANGE_REASONS.map(({ value, title, body, Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={reason === value}
                onClick={() => setReason(value)}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors",
                  reason === value ? "border-ink bg-sand ring-1 ring-ink" : "border-line-strong hover:border-ink/40",
                )}
              >
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", reason === value ? "bg-ink text-white" : "bg-sand text-ink")}>
                  <Icon className="size-[1.125rem]" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">{title}</span>
                  <span className="mt-0.5 block text-xs text-muted">{body}</span>
                </span>
              </button>
            ))}
          </div>
          {touched && problems.reason && <p className="mt-1.5 text-sm font-medium text-danger-700">{problems.reason}</p>}
        </fieldset>

        {item.quantity > 1 && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="exchange-qty" className="text-sm font-semibold text-ink">
              How many need an exchange?
            </label>
            <NativeSelect id="exchange-qty" value={String(quantity)} onChange={(e) => setQuantity(Number(e.target.value))} className="sm:w-40">
              {Array.from({ length: item.quantity }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} of {item.quantity}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="exchange-details" className="text-sm font-semibold text-ink">
            Tell us more <span className="text-danger-700">*</span>
          </label>
          <textarea
            id="exchange-details"
            rows={3}
            maxLength={1000}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={reason === "WRONG_ITEM" ? "e.g. I ordered the blue crawler but received the red one." : "e.g. The front wheel is broken and the remote does not switch on."}
            aria-invalid={touched && !!problems.details ? true : undefined}
            className="w-full resize-none rounded-xl border border-line-strong px-3.5 py-2.5 text-[0.9375rem] focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
          />
          <div className="flex justify-between gap-3 text-xs text-muted">
            <span>Keep the product and its box. Photos help — send them on WhatsApp.</span>
            <span className="tabular-nums">{details.length}/1000</span>
          </div>
          {touched && problems.details && <p className="text-sm font-medium text-danger-700">{problems.details}</p>}
        </div>

        <ShopContact orderNumber={order.orderNumber} compact />
      </div>
    </Dialog>
  );
}

/** Per-item exchange action / status under each product of a delivered order. */
export function ItemExchange({ order, item }: { order: CustomerOrder; item: CustomerOrderItem }) {
  const [open, setOpen] = useState(false);
  if (item.exchange) return <ExchangeStatusCard exchange={item.exchange} />;
  if (!item.canExchange) return null;
  return (
    <div className="mt-2 sm:ml-[5.5rem]">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong px-3.5 text-[0.8125rem] font-semibold text-ink transition-colors hover:border-ink hover:bg-sand"
      >
        <RefreshCcw className="size-3.5" aria-hidden="true" /> Wrong or broken? Exchange
      </button>
      {open && <ExchangeDialog order={order} item={item} open={open} onClose={() => setOpen(false)} />}
    </div>
  );
}

/** Explains the exchange policy for a delivered order, with the shop's contact details. */
export function ExchangeHelp({ order }: { order: CustomerOrder }) {
  if (order.status !== "DELIVERED") return null;
  const requested = order.items.filter((i) => i.exchange).length;
  const open = order.items.some((i) => i.canExchange);
  if (!open && requested === 0) {
    return (
      <section aria-labelledby="exchange-title" className="rounded-3xl border border-line bg-surface p-5 sm:p-7">
        <h2 id="exchange-title" className="flex items-center gap-2 text-lg font-semibold text-ink">
          <RefreshCcw className="size-[1.125rem]" aria-hidden="true" /> Exchanges
        </h2>
        <p className="mt-1.5 flex items-start gap-2 text-sm text-muted">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          The exchange window for this order has closed{order.exchangeWindowDays ? ` (${order.exchangeWindowDays} days after delivery)` : ""}. For help, contact the store.
        </p>
        <div className="mt-4">
          <ShopContact orderNumber={order.orderNumber} />
        </div>
      </section>
    );
  }
  return (
    <section aria-labelledby="exchange-title" className="rounded-3xl border border-line bg-surface p-5 sm:p-7">
      <h2 id="exchange-title" className="flex items-center gap-2 text-lg font-semibold text-ink">
        <RefreshCcw className="size-[1.125rem]" aria-hidden="true" /> Wrong or broken item?
      </h2>
      <p className="mt-1.5 text-sm text-muted">
        We exchange products that arrive wrong or damaged.{" "}
        {open && order.exchangeDeadline ? (
          <>
            Request it from the product above until <strong className="font-semibold text-ink">{formatDate(order.exchangeDeadline)}</strong>.
          </>
        ) : null}{" "}
        Each product can be exchanged once.
      </p>
      <div className="mt-4">
        <ShopContact orderNumber={order.orderNumber} />
      </div>
    </section>
  );
}
