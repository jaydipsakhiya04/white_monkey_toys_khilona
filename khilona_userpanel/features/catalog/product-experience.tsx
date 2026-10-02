"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { AlertCircle, Banknote, Check, ShoppingBag, Zap } from "lucide-react";
import { Button, ButtonAnchor } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { WhatsAppIcon } from "@/components/icons/brand";
import { useAddToCart } from "@/features/cart/use-add-to-cart";
import { absoluteUrl } from "@/lib/env";
import type { ProductDetail } from "@/types/api";
import { cn } from "@/utils/cn";
import { formatPrice } from "@/utils/format";
import { whatsappLink } from "@/utils/phone";
import { ProductGallery } from "./product-gallery";
import {
  initialSelection,
  resolveVariant,
  selectValue,
  selectionImage,
  sortedGroups,
  valueState,
  type Selection,
} from "./variants";

export function ProductExperience({ product, whatsapp }: { product: ProductDetail; whatsapp: string | null }) {
  const router = useRouter();
  const addToCart = useAddToCart();
  const groups = useMemo(() => sortedGroups(product), [product]);
  const hasVariants = product.hasVariants && groups.length > 0 && product.variants.length > 0;
  const [selection, setSelection] = useState<Selection>(() => initialSelection(groups));
  const [qty, setQty] = useState(1);
  const [attempted, setAttempted] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);

  const variant = hasVariants ? resolveVariant(product, groups, selection) : null;
  const complete = !hasVariants || groups.every((g) => selection[g.id]);
  const missing = groups.filter((g) => !selection[g.id]);
  const comboMissing = hasVariants && complete && !variant;

  const stock = hasVariants ? (variant?.stock ?? 0) : product.stock;
  const inStock = hasVariants ? !!variant && variant.inStock && variant.stock > 0 : product.inStock && product.stock > 0;
  const maxQty = Math.max(1, Math.min(99, stock));
  const quantity = Math.min(qty, maxQty);

  const priceInfo = variant
    ? { price: variant.price, effectivePrice: variant.effectivePrice, discountPercent: variant.discountPercent }
    : { price: product.price, effectivePrice: product.effectivePrice, discountPercent: product.discountPercent };
  const showRange = hasVariants && !variant && product.maxPrice > product.minPrice;

  const images = useMemo(
    () => [...product.images].sort((a, b) => a.position - b.position).map((i) => ({ url: i.url, alt: i.alt ?? product.name })),
    [product],
  );
  const galleryImages = images.length ? images : product.thumbnailUrl ? [{ url: product.thumbnailUrl, alt: product.name }] : [];
  const activeImage = variant?.imageUrl ?? selectionImage(product.variants, selection);

  const sku = variant?.sku ?? product.sku;
  const lowStock = inStock && (hasVariants ? stock <= 5 : product.stockStatus === "LOW_STOCK");

  const guidance = missing.length ? `Select ${missing.map((g) => g.name).join(" and ")}` : null;

  function requireSelection(): boolean {
    if (!hasVariants) return true;
    if (!complete || !variant) {
      setAttempted(true);
      optionsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      const target = optionsRef.current?.querySelector<HTMLButtonElement>("[data-missing='true'] button:not([disabled])");
      target?.focus({ preventScroll: true });
      return false;
    }
    return true;
  }

  function doAdd(silent = false) {
    if (!requireSelection() || !inStock) return false;
    addToCart(
      {
        productId: product.id,
        variantId: variant?.id ?? null,
        quantity,
        snapshot: {
          name: product.name,
          slug: product.slug,
          imageUrl: variant?.imageUrl ?? product.thumbnailUrl,
          unitPrice: priceInfo.effectivePrice,
          unitMrp: priceInfo.price,
          variantTitle: variant?.title ?? null,
          options: variant?.options ?? null,
          maxQuantity: maxQty,
        },
      },
      { silent },
    );
    return true;
  }

  const waText = `Hi! I'm interested in "${product.name}"${variant ? ` (${variant.title})` : ""}. ${absoluteUrl(`/product/${product.slug}`)}`;
  const waUrl = whatsapp ? whatsappLink(whatsapp, waText) : null;

  const stockLabel = comboMissing
    ? "This combination isn't available"
    : hasVariants && !complete
      ? null
      : !inStock
        ? "Out of stock"
        : lowStock
          ? `Only ${stock} left – order soon`
          : "In stock";

  const addLabel = !complete ? (guidance ?? "Select options") : !inStock ? "Out of stock" : "Add to cart";

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 md:gap-8 lg:gap-12 xl:grid-cols-[1.1fr_1fr]">
        <div className="md:sticky md:top-24 md:self-start">
          <ProductGallery
            images={galleryImages}
            activeUrl={activeImage}
            productName={product.name}
            badge={
              priceInfo.discountPercent > 0 && !showRange ? (
                <span className="absolute left-4 top-4 rounded-full bg-coral-600 px-3 py-1 text-sm font-bold text-white">
                  {priceInfo.discountPercent}% off
                </span>
              ) : null
            }
          />
        </div>

        <div className="min-w-0">
          <Link
            href={`/category/${product.category.slug}`}
            className="inline-flex rounded text-xs font-bold uppercase tracking-[0.12em] text-coral-600 hover:text-coral-700"
          >
            {product.category.name}
          </Link>
          <h1 className="mt-2 text-[1.75rem] font-extrabold leading-tight text-ink sm:text-4xl lg:text-[2.75rem]">{product.name}</h1>
          {sku && (
            <p className="mt-2 text-sm text-muted">
              SKU: <span className="font-medium text-ink">{sku}</span>
            </p>
          )}

          <div className="mt-5" aria-live="polite">
            <Price
              size="lg"
              price={priceInfo.price}
              effectivePrice={priceInfo.effectivePrice}
              discountPercent={priceInfo.discountPercent}
              minPrice={showRange ? product.minPrice : undefined}
              maxPrice={showRange ? product.maxPrice : undefined}
            />
            {!showRange && priceInfo.effectivePrice < priceInfo.price && (
              <p className="mt-1 text-sm font-semibold text-success-700">You save {formatPrice(priceInfo.price - priceInfo.effectivePrice)}</p>
            )}
            <p className="mt-1 text-xs text-muted">Inclusive of all taxes</p>
            {stockLabel && (
              <p
                className={cn(
                  "mt-3 inline-flex items-center gap-1.5 text-sm font-semibold",
                  !inStock || comboMissing ? "text-danger-700" : lowStock ? "text-coral-700" : "text-success-700",
                )}
              >
                {!inStock || comboMissing ? <AlertCircle className="size-4" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
                {stockLabel}
              </p>
            )}
          </div>

          {product.shortDescription && <p className="mt-5 text-base leading-relaxed text-muted">{product.shortDescription}</p>}

          {hasVariants && (
            <div ref={optionsRef} className="mt-6 space-y-5 border-t border-line pt-6">
              {groups.map((g) => {
                const selectedId = selection[g.id];
                const selectedValue = g.values.find((v) => v.id === selectedId)?.value;
                const isMissing = attempted && !selectedId;
                return (
                  <fieldset key={g.id} data-missing={!selectedId ? "true" : undefined}>
                    <legend className="mb-2.5 text-sm font-semibold text-ink">
                      {g.name}
                      {selectedValue ? (
                        <span className="font-normal text-muted">: {selectedValue}</span>
                      ) : (
                        <span className={cn("ml-2 font-medium", isMissing ? "text-danger-700" : "text-muted")}>Select {g.name}</span>
                      )}
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {g.values.map((v) => {
                        const state = valueState(product.variants, selection, g.id, v.id);
                        const selected = selectedId === v.id;
                        const disabled = state === "unavailable" || state === "out-of-stock";
                        return (
                          <button
                            key={v.id}
                            type="button"
                            aria-pressed={selected}
                            disabled={disabled}
                            title={disabled ? `${v.value} – out of stock` : state === "conflict" ? `${v.value} – available in other options` : v.value}
                            onClick={() => {
                              setSelection((s) =>
                                s[g.id] === v.id ? { ...s, [g.id]: undefined } : selectValue(product.variants, groups, s, g.id, v.id),
                              );
                              setQty(1);
                            }}
                            className={cn(
                              "relative min-h-11 min-w-11 rounded-xl border px-4 text-sm font-semibold transition-colors",
                              selected
                                ? "border-ink bg-ink text-white"
                                : disabled
                                  ? "cursor-not-allowed border-line bg-sand/50 text-muted/70 line-through decoration-1"
                                  : state === "conflict"
                                    ? "border-dashed border-line-strong bg-surface text-muted hover:border-ink/50 hover:text-ink"
                                    : "border-line-strong bg-surface text-ink hover:border-ink/50",
                              isMissing && !selected && !disabled && "border-danger/60",
                            )}
                          >
                            {v.value}
                            {disabled && <span className="sr-only"> (out of stock)</span>}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}
              {attempted && guidance && (
                <p role="alert" className="flex items-center gap-2 rounded-xl bg-coral-tint px-3.5 py-2.5 text-sm font-semibold text-coral-700">
                  <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                  {guidance} to continue
                </p>
              )}
            </div>
          )}

          <div className={cn("mt-6 space-y-3", !hasVariants && "border-t border-line pt-6")}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-ink" id="qty-label">
                Quantity
              </span>
              <QuantityStepper value={quantity} max={maxQty} onChange={setQty} disabled={!inStock} label="Quantity" />
              {inStock && stock <= 10 && <span className="text-xs text-muted">Max {maxQty}</span>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button size="lg" onClick={() => doAdd()} disabled={complete && !inStock} data-testid="add-to-cart">
                <ShoppingBag className="size-5" aria-hidden="true" />
                {addLabel}
              </Button>
              <Button
                size="lg"
                variant="dark"
                disabled={complete && !inStock}
                onClick={() => {
                  if (doAdd(true)) router.push("/checkout");
                }}
              >
                <Zap className="size-5" aria-hidden="true" />
                Buy now
              </Button>
            </div>
            {waUrl && (
              <ButtonAnchor href={waUrl} target="_blank" rel="noopener noreferrer" variant="outline" size="lg" block>
                <WhatsAppIcon className="size-5 text-success-700" />
                Ask about this on WhatsApp
              </ButtonAnchor>
            )}
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-sand p-4 text-sm text-ink">
            <Banknote className="mt-0.5 size-5 shrink-0 text-teal" aria-hidden="true" />
            <p>
              <span className="font-semibold">Cash / pay on delivery.</span>{" "}
              <span className="text-muted">No online payment needed — our team will call to confirm your order.</span>
            </p>
          </div>
        </div>
      </div>

      {/* mobile sticky purchase bar (sits above the tab bar) */}
      <div className="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom))] z-30 border-t border-line bg-surface/95 px-4 py-2.5 backdrop-blur-sm md:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted">{variant ? variant.title : product.name}</p>
            <p className="font-display text-lg font-bold leading-tight text-ink tabular-nums">
              {showRange ? `From ${formatPrice(product.minPrice)}` : formatPrice(priceInfo.effectivePrice)}
            </p>
          </div>
          <Button onClick={() => doAdd()} disabled={complete && !inStock} className="shrink-0 px-4">
            <ShoppingBag className="size-[1.125rem]" aria-hidden="true" />
            {!complete ? "Select options" : !inStock ? "Out of stock" : "Add to cart"}
          </Button>
        </div>
      </div>
    </>
  );
}
