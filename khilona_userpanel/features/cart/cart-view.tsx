"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, ArrowLeft, Banknote, Info, ShoppingBag, Trash2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/overlay";
import { EmptyState } from "@/components/ui/empty-state";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Skeleton } from "@/components/ui/skeleton";
import { SmartImage } from "@/components/ui/smart-image";
import { errorMessage } from "@/lib/api/errors";
import { cn } from "@/utils/cn";
import { formatPrice } from "@/utils/format";
import { MAX_LINE_QTY, useCartStore } from "./cart-store";
import { OrderSummaryRows } from "./order-summary";
import { useCartValidation, type LineView } from "./use-cart-validation";

export function CartView() {
  const router = useRouter();
  const v = useCartValidation();
  const clear = useCartStore((s) => s.clear);
  const [confirmClear, setConfirmClear] = useState(false);

  if (!v.hydrated) return <CartSkeleton />;

  if (v.items.length === 0) {
    return (
      <EmptyState
        headingLevel="h2"
        icon={<ShoppingBag />}
        title="Your cart is empty"
        description="Looks like you haven't added anything yet. Let's find something fun!"
      >
        <ButtonLink href="/products">Start shopping</ButtonLink>
        <ButtonLink href="/categories" variant="outline">
          Browse categories
        </ButtonLink>
      </EmptyState>
    );
  }

  const canCheckout = !!v.summary && !v.hasIssues && !v.error && v.summary.itemsCount > 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start xl:grid-cols-[1fr_24rem] xl:gap-12">
      <section aria-labelledby="cart-items-title" className="min-w-0">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="cart-items-title" className="text-lg font-bold text-ink">
            {v.items.length} {v.items.length === 1 ? "product" : "products"}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)} className="text-danger-700 hover:bg-danger-tint">
            <Trash2 className="size-4" aria-hidden="true" />
            Clear cart
          </Button>
        </div>

        {v.hasIssues && (
          <div role="alert" className="mb-4 flex gap-3 rounded-2xl border border-danger/30 bg-danger-tint p-4 text-sm text-danger-700">
            <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
            <p>
              <span className="font-semibold">
                {v.blockingCount === 1 ? "1 item needs your attention." : `${v.blockingCount} items need your attention.`}
              </span>{" "}
              Remove unavailable items to continue to checkout.
            </p>
          </div>
        )}
        {v.error ? (
          <div role="alert" className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-sun-tint p-4 text-sm text-ink">
            <Info className="size-5 shrink-0" aria-hidden="true" />
            <p className="min-w-0 flex-1">{errorMessage(v.error, "We couldn't check the latest prices and stock.")}</p>
            <Button size="sm" variant="outline" onClick={() => v.refetch()} loading={v.isFetching}>
              Retry
            </Button>
          </div>
        ) : null}

        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface" aria-busy={v.isFetching || undefined}>
          {v.lines.map((l) => (
            <CartRow key={l.item.key} view={l} note={v.notes[l.item.key]} onDismissNote={() => v.dismissNote(l.item.key)} />
          ))}
        </ul>

        <Link href="/products" className="mt-5 inline-flex items-center gap-2 rounded-lg py-2 text-sm font-semibold text-ink hover:text-coral-600">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Continue shopping
        </Link>
      </section>

      <aside aria-labelledby="summary-title" className="lg:sticky lg:top-24">
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h2 id="summary-title" className="text-xl font-bold text-ink">
            Order summary
          </h2>
          <div className="mt-4" aria-live="polite">
            {v.summary ? (
              <OrderSummaryRows summary={v.summary} className={cn(v.isFetching && "opacity-60")} />
            ) : v.error ? (
              <p className="text-sm text-muted">Totals will appear once we can reach the store.</p>
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-7 w-full" />
              </div>
            )}
          </div>
          <Button
            size="lg"
            block
            className="mt-5"
            disabled={!canCheckout || v.isFetching}
            loading={v.isLoading}
            loadingText="Checking stock…"
            onClick={() => router.push("/checkout")}
          >
            Proceed to checkout
          </Button>
          {v.hasIssues && <p className="mt-2 text-center text-xs font-medium text-danger-700">Resolve the highlighted items to continue.</p>}
          <p className="mt-4 flex items-start gap-2 text-xs text-muted">
            <Banknote className="size-4 shrink-0 text-teal" aria-hidden="true" />
            Pay with cash on delivery. No online payment needed.
          </p>
        </div>
      </aside>

      <Dialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear your cart?"
        description="This removes all items from your cart. This can't be undone."
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmClear(false)} data-autofocus>
              Keep items
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                clear();
                setConfirmClear(false);
              }}
            >
              Clear cart
            </Button>
          </div>
        }
      />
    </div>
  );
}

function CartRow({ view, note, onDismissNote }: { view: LineView; note?: string; onDismissNote: () => void }) {
  const { item, line, blocking } = view;
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const name = line?.product?.name ?? item.snapshot.name;
  const slug = line?.product?.slug ?? item.snapshot.slug;
  const image = line?.variant?.imageUrl ?? line?.product?.thumbnailUrl ?? item.snapshot.imageUrl;
  const options = line?.variant?.options ?? item.snapshot.options;
  const unitPrice = line && !blocking ? line.unitPrice : item.snapshot.unitPrice;
  const unitMrp = line && !blocking ? line.unitMrp : item.snapshot.unitMrp;
  const max = Math.max(1, Math.min(MAX_LINE_QTY, line?.maxQuantity || item.snapshot.maxQuantity || MAX_LINE_QTY));
  const message =
    blocking && line
      ? line.message ||
        (line.status === "OUT_OF_STOCK"
          ? "This item is out of stock"
          : line.status === "VARIANT_REQUIRED"
            ? "Please choose options for this product again"
            : "This product is no longer available")
      : null;

  return (
    <li className={cn("flex gap-3 p-3 sm:gap-4 sm:p-4", blocking && "bg-danger-tint/40")} data-testid="cart-line">
      <Link href={`/product/${slug}`} className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-sand sm:size-24" tabIndex={-1} aria-hidden="true">
        <SmartImage src={image} alt="" fill sizes="96px" className={cn("object-contain p-1.5", blocking && "opacity-50")} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/product/${slug}`} className="line-clamp-2 font-semibold leading-snug text-ink hover:text-coral-700">
              {name}
            </Link>
            {options && Object.keys(options).length > 0 && (
              <p className="mt-0.5 text-sm text-muted">
                {Object.entries(options)
                  .map(([k, val]) => `${k}: ${val}`)
                  .join(" · ")}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => remove(item.key)}
            aria-label={`Remove ${name} from cart`}
            className="-mr-1 -mt-1 grid size-10 shrink-0 place-items-center rounded-xl text-muted hover:bg-danger-tint hover:text-danger-700"
          >
            <Trash2 className="size-[1.125rem]" aria-hidden="true" />
          </button>
        </div>

        {message && (
          <p className="flex items-center gap-1.5 text-sm font-semibold text-danger-700" role="status">
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            {message}
          </p>
        )}
        {!message && note && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-coral-700" role="status">
            <Info className="size-4 shrink-0" aria-hidden="true" />
            {note}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-2">
          {blocking ? (
            <Button size="sm" variant="outline" onClick={() => remove(item.key)}>
              Remove item
            </Button>
          ) : (
            <QuantityStepper
              size="sm"
              value={item.quantity}
              max={max}
              label={`Quantity for ${name}`}
              onChange={(q) => {
                onDismissNote();
                setQuantity(item.key, q);
              }}
            />
          )}
          <div className="text-right">
            <p className="font-display text-base font-bold tabular-nums text-ink sm:text-lg">
              {blocking ? "—" : formatPrice(line && !blocking ? line.lineTotal : unitPrice * item.quantity)}
            </p>
            {!blocking && (
              <p className="text-xs text-muted tabular-nums">
                {formatPrice(unitPrice)} each
                {unitMrp > unitPrice && <span className="ml-1 line-through">{formatPrice(unitMrp)}</span>}
              </p>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function CartSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]" aria-hidden="true">
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-4 rounded-2xl border border-line bg-surface p-4">
            <Skeleton className="size-24" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="mt-4 h-9 w-32" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}
