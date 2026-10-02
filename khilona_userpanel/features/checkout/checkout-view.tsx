"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, ArrowRight, Banknote, Check, Lock, MapPin, Pencil, ShoppingBag, Store as StoreIcon, User } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TextAreaField, TextField } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { SmartImage } from "@/components/ui/smart-image";
import { Spinner } from "@/components/ui/spinner";
import { useCartStore, type CartItem } from "@/features/cart/cart-store";
import { OrderSummaryRows } from "@/features/cart/order-summary";
import { useCartValidation, type LineView } from "@/features/cart/use-cart-validation";
import { ApiError, errorMessage, isApiError } from "@/lib/api/errors";
import { createOrder } from "@/services/orders";
import type { CreateOrderInput, PublicOrder } from "@/types/api";
import { cn } from "@/utils/cn";
import { formatPrice } from "@/utils/format";
import { INDIAN_STATES } from "@/utils/indian-states";
import { normalizeIndianMobile } from "@/utils/phone";
import { UseLocationButton, mapsLinkFor } from "./location-button";
import { EMPTY_CHECKOUT, STEPS, STEP_FIELDS, checkoutSchema, stepOfField, type CheckoutValues } from "./schema";
import { saveOrderSnapshot } from "./order-storage";

const FORM_KEY = "khilona-checkout-v1";

type SubmitIssue =
  | { kind: "stock"; message: string; items: { name: string; message: string }[] }
  | { kind: "closed"; message: string }
  | { kind: "network"; message: string }
  | { kind: "other"; message: string };

function readSaved(): { values: CheckoutValues; step: number } | null {
  try {
    const raw = sessionStorage.getItem(FORM_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { values?: Partial<CheckoutValues>; step?: number };
    return { values: { ...EMPTY_CHECKOUT, ...(parsed.values ?? {}) }, step: Math.min(Math.max(0, parsed.step ?? 0), 2) };
  } catch {
    return null;
  }
}

function toPayload(v: CheckoutValues, items: CartItem[]): CreateOrderInput {
  const opt = (s: string) => (s.trim() ? s.trim() : undefined);
  return {
    customerName: v.customerName.trim(),
    phone: normalizeIndianMobile(v.phone),
    alternatePhone: v.alternatePhone.trim() ? normalizeIndianMobile(v.alternatePhone) : undefined,
    email: opt(v.email),
    address: v.address.trim(),
    city: v.city.trim(),
    state: v.state.trim(),
    pincode: v.pincode.trim(),
    landmark: opt(v.landmark),
    googleMapsLink: opt(v.googleMapsLink),
    locationLink: opt(v.locationLink),
    latitude: v.latitude ?? undefined,
    longitude: v.longitude ?? undefined,
    note: opt(v.note),
    items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
  };
}

export function CheckoutView({ storeOpen, closedMessage }: { storeOpen: boolean; closedMessage: string | null }) {
  const router = useRouter();
  const cart = useCartValidation();
  const clearCart = useCartStore((s) => s.clear);
  const [step, setStep] = useState(0);
  const [restored, setRestored] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<string | null>(null);
  const [issue, setIssue] = useState<SubmitIssue | null>(null);
  const submittingRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: EMPTY_CHECKOUT,
    mode: "onTouched",
  });
  const { register, handleSubmit, trigger, setValue, setError, getValues, control, formState, reset } = form;
  const errors = formState.errors;
  const values = useWatch({ control });

  // restore progress from sessionStorage
  useEffect(() => {
    const saved = readSaved();
    if (saved) {
      reset(saved.values);
      setStep(saved.step);
    }
    setRestored(true);
  }, [reset]);

  // persist progress
  useEffect(() => {
    if (!restored || placedOrder) return;
    const t = window.setTimeout(() => {
      try {
        sessionStorage.setItem(FORM_KEY, JSON.stringify({ values, step }));
      } catch {
        // storage full / disabled — ignore
      }
    }, 250);
    return () => window.clearTimeout(t);
  }, [values, step, restored, placedOrder]);

  const goTo = (s: number) => {
    setStep(s);
    setIssue(null);
    requestAnimationFrame(() => {
      headingRef.current?.focus({ preventScroll: true });
      headingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const next = async () => {
    const ok = await trigger(STEP_FIELDS[step] as FieldPath<CheckoutValues>[], { shouldFocus: true });
    if (ok) goTo(step + 1);
  };

  const mutation = useMutation<PublicOrder, ApiError, CreateOrderInput>({
    mutationFn: createOrder,
    onSuccess: (order) => {
      saveOrderSnapshot(order);
      setPlacedOrder(order.orderNumber);
      try {
        sessionStorage.removeItem(FORM_KEY);
      } catch {
        // ignore
      }
      clearCart();
      router.replace(`/order/success/${encodeURIComponent(order.orderNumber)}`);
    },
    onError: (err) => {
      submittingRef.current = false;
      if (!isApiError(err)) {
        setIssue({ kind: "other", message: "Something went wrong. Please try again." });
        return;
      }
      if (err.isNetworkError) {
        setIssue({ kind: "network", message: "We couldn't reach the store. Check your internet connection and try again." });
        return;
      }
      if (err.status === 422) {
        let firstStep = 3;
        const itemMessages: string[] = [];
        for (const e of err.errors) {
          const field = e.field?.split(".")[0];
          if (field && field in EMPTY_CHECKOUT) {
            setError(field as keyof CheckoutValues, { type: "server", message: e.message });
            firstStep = Math.min(firstStep, stepOfField(field));
          } else {
            itemMessages.push(e.message);
          }
        }
        if (firstStep < 2) {
          setStep(firstStep);
          setIssue({ kind: "other", message: "Please fix the highlighted fields." });
        } else {
          setIssue({ kind: "other", message: itemMessages[0] ?? err.message ?? "Some details are invalid." });
        }
        return;
      }
      if (err.status === 409) {
        const items = cart.items;
        const list = err.errors.map((e) => {
          const idx = Number(e.field?.match(/^items\.(\d+)/)?.[1]);
          const name = Number.isInteger(idx) && items[idx] ? items[idx].snapshot.name : "An item";
          return { name, message: e.message };
        });
        setIssue({ kind: "stock", message: err.message || "Some items are no longer available in the requested quantity.", items: list });
        void cart.refetch();
        return;
      }
      if (err.status === 403) {
        setIssue({ kind: "closed", message: err.message || closedMessage || "The store is not accepting orders right now." });
        return;
      }
      setIssue({ kind: "other", message: errorMessage(err) });
    },
  });

  const onPlaceOrder = handleSubmit(
    (v) => {
      if (submittingRef.current || mutation.isPending) return;
      if (cart.hasIssues || !cart.validatedCurrent) return;
      submittingRef.current = true;
      setIssue(null);
      mutation.mutate(toPayload(v, cart.items));
    },
    (errs) => {
      const first = Object.keys(errs)[0];
      if (first) setStep(stepOfField(first));
    },
  );

  const summaryLines = useMemo(() => cart.lines.filter((l) => !l.blocking), [cart.lines]);

  // ---------- render states ----------
  if (placedOrder) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center" role="status">
        <Spinner className="size-8 text-coral-600" />
        <p className="font-semibold text-ink">Order placed! Taking you to your confirmation…</p>
      </div>
    );
  }
  if (!cart.hydrated || !restored) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_24rem]" aria-hidden="true">
        <Skeleton className="h-[28rem] w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }
  if (cart.items.length === 0) {
    return (
      <EmptyState icon={<ShoppingBag />} title="Your cart is empty" description="Add a few things to your cart before checking out.">
        <ButtonLink href="/products">Start shopping</ButtonLink>
      </EmptyState>
    );
  }

  const placing = mutation.isPending;
  const canPlace = cart.validatedCurrent && !cart.hasIssues && !!cart.summary;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start xl:grid-cols-[1fr_25rem] xl:gap-12">
      <div className="min-w-0">
        <Stepper step={step} onStepClick={(s) => s < step && goTo(s)} />

        {!storeOpen && (
          <div role="alert" className="mt-5 flex gap-3 rounded-2xl border border-danger/30 bg-danger-tint p-4 text-sm text-danger-700">
            <StoreIcon className="size-5 shrink-0" aria-hidden="true" />
            <p>
              <span className="font-semibold">The store is currently closed for orders.</span> {closedMessage}
            </p>
          </div>
        )}

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 2) void next();
            else void onPlaceOrder();
          }}
          className="mt-6 rounded-2xl border border-line bg-surface p-5 sm:p-7"
          aria-labelledby="checkout-step-title"
        >
          <h2 id="checkout-step-title" ref={headingRef} tabIndex={-1} className="scroll-mt-28 text-xl font-bold text-ink focus:outline-none sm:text-2xl">
            {step === 0 ? "Contact details" : step === 1 ? "Delivery address & location" : "Review your order"}
          </h2>

          {step === 0 && (
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <TextField
                label="Full name"
                autoComplete="name"
                wrapperClassName="sm:col-span-2"
                error={errors.customerName?.message}
                {...register("customerName")}
              />
              <TextField
                label="Mobile number"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                hint="10-digit mobile. We'll call to confirm your order."
                error={errors.phone?.message}
                {...register("phone")}
              />
              <TextField
                label="Alternate mobile"
                optional
                type="tel"
                inputMode="tel"
                autoComplete="off"
                error={errors.alternatePhone?.message}
                {...register("alternatePhone")}
              />
              <TextField
                label="Email"
                optional
                type="email"
                inputMode="email"
                autoComplete="email"
                wrapperClassName="sm:col-span-2"
                hint="For order updates (optional)."
                error={errors.email?.message}
                {...register("email")}
              />
            </div>
          )}

          {step === 1 && (
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <TextAreaField
                label="Full address"
                rows={3}
                autoComplete="street-address"
                hint="House / flat no., building, street, area"
                wrapperClassName="sm:col-span-2"
                error={errors.address?.message}
                {...register("address")}
              />
              <TextField label="City" autoComplete="address-level2" error={errors.city?.message} {...register("city")} />
              <div>
                <TextField
                  label="State"
                  list="indian-states"
                  autoComplete="address-level1"
                  hint="Start typing to pick from the list"
                  error={errors.state?.message}
                  {...register("state")}
                />
                <datalist id="indian-states">
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <TextField
                label="Pincode"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                error={errors.pincode?.message}
                {...register("pincode")}
              />
              <TextField label="Landmark" optional autoComplete="off" error={errors.landmark?.message} {...register("landmark")} />

              <div className="sm:col-span-2">
                <UseLocationButton
                  latitude={values.latitude ?? null}
                  longitude={values.longitude ?? null}
                  onLocated={(lat, lng) => {
                    setValue("latitude", lat, { shouldDirty: true });
                    setValue("longitude", lng, { shouldDirty: true });
                    setValue("googleMapsLink", mapsLinkFor(lat, lng), { shouldDirty: true, shouldValidate: true });
                  }}
                  onClear={() => {
                    const link = getValues("googleMapsLink");
                    const lat = getValues("latitude");
                    const lng = getValues("longitude");
                    if (lat !== null && lng !== null && link === mapsLinkFor(lat, lng)) setValue("googleMapsLink", "");
                    setValue("latitude", null);
                    setValue("longitude", null);
                  }}
                />
              </div>
              <TextField
                label="Google Maps link"
                optional
                type="url"
                inputMode="url"
                placeholder="https://maps.google.com/…"
                wrapperClassName="sm:col-span-2"
                error={errors.googleMapsLink?.message}
                {...register("googleMapsLink")}
              />
              <TextField
                label="Other location link"
                optional
                type="url"
                inputMode="url"
                hint="Any other shared location link (e.g. from WhatsApp)."
                wrapperClassName="sm:col-span-2"
                error={errors.locationLink?.message}
                {...register("locationLink")}
              />
              <TextAreaField
                label="Special note"
                optional
                rows={3}
                hint="Delivery instructions, gift message, preferred time…"
                wrapperClassName="sm:col-span-2"
                error={errors.note?.message}
                {...register("note")}
              />
            </div>
          )}

          {step === 2 && (
            <ReviewStep
              values={getValues()}
              lines={cart.lines}
              isFetching={cart.isFetching}
              hasIssues={cart.hasIssues}
              onEdit={(s) => goTo(s)}
            />
          )}

          {issue && <IssueBanner issue={issue} onRetry={() => void onPlaceOrder()} />}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => goTo(step - 1)} disabled={placing}>
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back
              </Button>
            ) : (
              <ButtonLink href="/cart" variant="ghost">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to cart
              </ButtonLink>
            )}
            {step < 2 ? (
              <Button type="submit" size="lg" className="sm:min-w-56">
                Continue
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="lg"
                className="sm:min-w-64"
                disabled={!canPlace || placing}
                loading={placing}
                loadingText="Placing order…"
                data-testid="place-order"
              >
                <Lock className="size-4" aria-hidden="true" />
                Place order{cart.summary ? ` · ${formatPrice(cart.summary.total)}` : ""}
              </Button>
            )}
          </div>
        </form>
      </div>

      <aside aria-labelledby="co-summary-title" className="lg:sticky lg:top-24">
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 id="co-summary-title" className="text-lg font-bold text-ink">
              Order summary
            </h2>
            <Link href="/cart" className="text-sm font-semibold text-coral-600 hover:text-coral-700">
              Edit cart
            </Link>
          </div>
          <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
            {summaryLines.map(({ item, line }) => (
              <li key={item.key} className="flex items-center gap-3">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-sand">
                  <SmartImage src={line?.variant?.imageUrl ?? line?.product?.thumbnailUrl ?? item.snapshot.imageUrl} alt="" fill sizes="56px" className="object-contain p-1" />
                  <span className="absolute -right-0 -top-0 grid h-5 min-w-5 place-items-center rounded-bl-lg bg-ink px-1 text-[0.6875rem] font-bold text-white">
                    {line?.quantity ?? item.quantity}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold text-ink">{line?.product?.name ?? item.snapshot.name}</p>
                  {(line?.variant?.title || item.snapshot.variantTitle) && (
                    <p className="line-clamp-1 text-xs text-muted">{line?.variant?.title ?? item.snapshot.variantTitle}</p>
                  )}
                </div>
                <p className="text-sm font-semibold tabular-nums text-ink">{line ? formatPrice(line.lineTotal) : "…"}</p>
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-line pt-4">
            {cart.summary ? (
              <OrderSummaryRows summary={cart.summary} className={cn(cart.isFetching && "opacity-60")} />
            ) : cart.error ? (
              <p className="text-sm text-danger-700">{errorMessage(cart.error, "Couldn't load totals.")}</p>
            ) : (
              <Skeleton className="h-28 w-full" />
            )}
          </div>
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-sand p-3 text-sm text-ink">
            <Banknote className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" />
            <span>
              <span className="font-semibold">Payment: Cash / pay on delivery.</span> No online payment.
            </span>
          </p>
        </div>
      </aside>
    </div>
  );
}

function Stepper({ step, onStepClick }: { step: number; onStepClick: (s: number) => void }) {
  return (
    <nav aria-label="Checkout progress">
      <ol className="flex items-center gap-2 sm:gap-3">
        {STEPS.map((s, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li
              key={s.id}
              className={cn(
                "flex min-w-0 items-center gap-2 sm:gap-3",
                i === STEPS.length - 1 ? "flex-none" : current ? "flex-[1.6] sm:flex-1" : "flex-1",
              )}
            >
              <button
                type="button"
                onClick={() => onStepClick(i)}
                disabled={!done}
                aria-current={current ? "step" : undefined}
                className={cn("flex min-w-0 items-center gap-2 rounded-xl py-1 text-left", done && "hover:opacity-80")}
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
                    done ? "bg-success-700 text-white" : current ? "bg-ink text-white" : "border border-line-strong bg-surface text-muted",
                  )}
                  aria-hidden="true"
                >
                  {done ? <Check className="size-4" /> : i + 1}
                </span>
                <span className={cn("truncate text-sm font-semibold", current ? "text-ink" : "sr-only text-muted sm:not-sr-only")}>
                  <span className="sr-only">
                    Step {i + 1} of {STEPS.length}:{" "}
                  </span>
                  {s.label}
                  {done && <span className="sr-only"> (completed)</span>}
                </span>
              </button>
              {i < STEPS.length - 1 && <span className={cn("h-0.5 min-w-3 flex-1 rounded-full", done ? "bg-success-700" : "bg-line")} aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function ReviewStep({
  values,
  lines,
  isFetching,
  hasIssues,
  onEdit,
}: {
  values: CheckoutValues;
  lines: LineView[];
  isFetching: boolean;
  hasIssues: boolean;
  onEdit: (step: number) => void;
}) {
  const blocking = lines.filter((l) => l.blocking);
  const addressLine = [values.city, values.state].filter(Boolean).join(", ") + (values.pincode ? ` – ${values.pincode}` : "");
  return (
    <div className="mt-6 space-y-5">
      {hasIssues && (
        <div role="alert" className="rounded-2xl border border-danger/30 bg-danger-tint p-4 text-sm text-danger-700">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4" aria-hidden="true" />
            Some items in your cart can&apos;t be ordered:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {blocking.map(({ item, line }) => (
              <li key={item.key}>
                {line?.product?.name ?? item.snapshot.name} — {line?.message ?? "unavailable"}
              </li>
            ))}
          </ul>
          <Link href="/cart" className="mt-3 inline-block font-semibold underline underline-offset-4">
            Go to cart to fix
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <ReviewCard title="Contact" icon={<User className="size-4" aria-hidden="true" />} onEdit={() => onEdit(0)}>
          <p className="font-semibold text-ink">{values.customerName}</p>
          <p>{values.phone}</p>
          {values.alternatePhone && <p>Alt: {values.alternatePhone}</p>}
          {values.email && <p className="break-all">{values.email}</p>}
        </ReviewCard>
        <ReviewCard title="Delivery address" icon={<MapPin className="size-4" aria-hidden="true" />} onEdit={() => onEdit(1)}>
          <p className="whitespace-pre-line text-ink">{values.address}</p>
          <p>{addressLine}</p>
          {values.landmark && <p>Landmark: {values.landmark}</p>}
          {(values.googleMapsLink || values.latitude !== null) && <p className="font-medium text-success-700">Location shared</p>}
          {values.note && <p className="mt-1 italic">“{values.note}”</p>}
        </ReviewCard>
      </div>

      <div>
        <h3 className="mb-2 flex items-center gap-2 font-sans text-sm font-bold tracking-normal text-ink">
          Items {isFetching && <Spinner className="size-3.5 text-muted" />}
        </h3>
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {lines.map(({ item, line, blocking: bad }) => (
            <li key={item.key} className={cn("flex items-center gap-3 p-3", bad && "bg-danger-tint/40")}>
              <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-sand">
                <SmartImage src={line?.variant?.imageUrl ?? line?.product?.thumbnailUrl ?? item.snapshot.imageUrl} alt="" fill sizes="48px" className="object-contain p-1" />
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <p className="line-clamp-1 font-semibold text-ink">{line?.product?.name ?? item.snapshot.name}</p>
                <p className="text-muted">
                  {line?.variant?.title ?? item.snapshot.variantTitle ?? ""}
                  {(line?.variant?.title ?? item.snapshot.variantTitle) ? " · " : ""}Qty {line?.quantity ?? item.quantity}
                  {line && !bad ? ` × ${formatPrice(line.unitPrice)}` : ""}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums text-ink">{bad ? "—" : line ? formatPrice(line.lineTotal) : "…"}</p>
            </li>
          ))}
        </ul>
      </div>

      <p className="flex items-start gap-2 rounded-2xl bg-teal-tint p-4 text-sm text-teal-700">
        <Banknote className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <span>
          <span className="font-bold">Payment: Cash / Pay on delivery — no online payment.</span> Our team will contact you to confirm your
          order and delivery.
        </span>
      </p>
    </div>
  );
}

function ReviewCard({ title, icon, onEdit, children }: { title: string; icon: React.ReactNode; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-page p-4 text-sm text-muted">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-sans text-sm font-bold tracking-normal text-ink">
          {icon}
          {title}
        </h3>
        <button type="button" onClick={onEdit} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-coral-600 hover:bg-coral-tint">
          <Pencil className="size-3.5" aria-hidden="true" />
          Edit<span className="sr-only"> {title.toLowerCase()}</span>
        </button>
      </div>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

function IssueBanner({ issue, onRetry }: { issue: SubmitIssue; onRetry: () => void }) {
  return (
    <div role="alert" className="mt-6 rounded-2xl border border-danger/30 bg-danger-tint p-4 text-sm text-danger-700">
      <p className="flex items-start gap-2 font-semibold">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {issue.message}
      </p>
      {issue.kind === "stock" && (
        <>
          {issue.items.length > 0 && (
            <ul className="ml-6 mt-2 list-disc space-y-1">
              {issue.items.map((i, idx) => (
                <li key={idx}>
                  {i.message.startsWith(i.name) ? (
                    i.message
                  ) : (
                    <>
                      <span className="font-semibold">{i.name}</span>: {i.message}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
          <Link href="/cart" className="ml-6 mt-3 inline-block font-semibold underline underline-offset-4">
            Review your cart
          </Link>
        </>
      )}
      {issue.kind === "network" && (
        <Button size="sm" variant="outline" className="ml-6 mt-3" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
