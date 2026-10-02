"use client";

import Link from "next/link";
import { useEffect, useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { ProductFacets } from "@/types/api";
import { cn } from "@/utils/cn";
import { formatPrice } from "@/utils/format";
import type { ListingParams } from "@/utils/listing";
import { useListingNav } from "./listing-nav";

type Draft = {
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  featured: boolean;
  options: string[];
};

function fromParams(p: ListingParams): Draft {
  return {
    minPrice: p.minPrice !== undefined ? String(p.minPrice) : "",
    maxPrice: p.maxPrice !== undefined ? String(p.maxPrice) : "",
    inStock: p.inStock,
    featured: p.featured,
    options: p.options,
  };
}

function toPatch(d: Draft) {
  return {
    minPrice: d.minPrice || null,
    maxPrice: d.maxPrice || null,
    inStock: d.inStock ? "true" : null,
    featured: d.featured ? "true" : null,
    options: d.options.length ? d.options.join(",") : null,
  };
}

export function FilterPanel({
  facets,
  current,
  mode,
  showCategories,
  onApplied,
}: {
  facets: ProductFacets | null;
  current: ListingParams;
  mode: "sidebar" | "sheet";
  showCategories?: boolean;
  onApplied?: () => void;
}) {
  const { update } = useListingNav();
  const [draft, setDraft] = useState<Draft>(() => fromParams(current));
  const [priceError, setPriceError] = useState<string | null>(null);
  const uid = useId();
  const currentKey = JSON.stringify(fromParams(current));

  // resync when URL changes (back/forward, chip removal)
  useEffect(() => {
    setDraft(JSON.parse(currentKey) as Draft);
  }, [currentKey]);

  const commit = (d: Draft) => {
    const min = d.minPrice === "" ? undefined : Number(d.minPrice);
    const max = d.maxPrice === "" ? undefined : Number(d.maxPrice);
    if (min !== undefined && max !== undefined && min > max) {
      setPriceError("Minimum price can't be more than maximum price.");
      return false;
    }
    setPriceError(null);
    update(toPatch(d));
    return true;
  };

  const change = (patch: Partial<Draft>, immediate = mode === "sidebar") => {
    const next = { ...draft, ...patch };
    setDraft(next);
    if (immediate) commit(next);
  };

  const toggleOption = (token: string) => {
    const has = draft.options.includes(token);
    change({ options: has ? draft.options.filter((o) => o !== token) : [...draft.options, token] });
  };

  const onPriceSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === "sidebar") commit(draft);
  };

  const range = facets?.priceRange;
  const sectionTitle = "font-display text-[0.9375rem] font-bold text-ink";

  return (
    <div className={cn("flex flex-col", mode === "sheet" ? "gap-6 px-5 py-5" : "gap-7")}>
      {showCategories && facets && facets.categories.length > 0 && (
        <section aria-labelledby={`${uid}-cat`}>
          <h3 id={`${uid}-cat`} className={sectionTitle}>
            Category
          </h3>
          <ul className="mt-3 space-y-0.5">
            {facets.categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/category/${c.slug}${current.search ? `?search=${encodeURIComponent(current.search)}` : ""}`}
                  className="flex min-h-10 items-center justify-between gap-3 rounded-lg px-2 text-sm text-ink hover:bg-sand"
                >
                  <span className="truncate">{c.name}</span>
                  <span className="text-xs text-muted tabular-nums">{c.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby={`${uid}-avail`}>
        <h3 id={`${uid}-avail`} className={sectionTitle}>
          Availability
        </h3>
        <div className="mt-3 space-y-3">
          <ToggleRow label="In stock only" checked={draft.inStock} onChange={(v) => change({ inStock: v })} />
          <ToggleRow label="Featured only" checked={draft.featured} onChange={(v) => change({ featured: v })} />
        </div>
      </section>

      <section aria-labelledby={`${uid}-price`}>
        <h3 id={`${uid}-price`} className={sectionTitle}>
          Price
        </h3>
        {range && range.max > 0 && (
          <p className="mt-1 text-xs text-muted">
            {formatPrice(range.min)} – {formatPrice(range.max)}
          </p>
        )}
        <form onSubmit={onPriceSubmit} className="mt-3" noValidate>
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor={`${uid}-min`} className="mb-1 block text-xs font-semibold text-muted">
                Min (₹)
              </label>
              <input
                id={`${uid}-min`}
                type="number"
                inputMode="numeric"
                min={0}
                value={draft.minPrice}
                placeholder={range ? String(Math.floor(range.min)) : "0"}
                onChange={(e) => setDraft({ ...draft, minPrice: e.target.value })}
                className="h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-sm focus:border-coral-600 focus:outline-none focus:ring-2 focus:ring-coral-600/25"
              />
            </div>
            <span className="pb-3 text-muted" aria-hidden="true">
              –
            </span>
            <div className="min-w-0 flex-1">
              <label htmlFor={`${uid}-max`} className="mb-1 block text-xs font-semibold text-muted">
                Max (₹)
              </label>
              <input
                id={`${uid}-max`}
                type="number"
                inputMode="numeric"
                min={0}
                value={draft.maxPrice}
                placeholder={range ? String(Math.ceil(range.max)) : "Any"}
                onChange={(e) => setDraft({ ...draft, maxPrice: e.target.value })}
                className="h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-sm focus:border-coral-600 focus:outline-none focus:ring-2 focus:ring-coral-600/25"
              />
            </div>
            {mode === "sidebar" && (
              <Button type="submit" variant="outline" size="sm" className="h-11 shrink-0">
                Go
              </Button>
            )}
          </div>
          {priceError && (
            <p className="mt-2 text-xs font-medium text-danger-700" role="alert">
              {priceError}
            </p>
          )}
        </form>
      </section>

      {facets?.options.map((group) => (
        <fieldset key={group.name}>
          <legend className={sectionTitle}>{group.name}</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {group.values.map((v) => {
              const token = `${group.name}:${v}`;
              const checked = draft.options.includes(token);
              return (
                <label
                  key={token}
                  className={cn(
                    "relative inline-flex min-h-10 cursor-pointer items-center rounded-xl border px-3.5 text-sm font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-coral-600",
                    checked ? "border-ink bg-ink text-white" : "border-line-strong bg-surface text-ink hover:border-ink/40",
                  )}
                >
                  <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleOption(token)} />
                  {v}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      {mode === "sheet" && (
        <div className="sticky bottom-0 -mx-5 -mb-5 flex gap-3 border-t border-line bg-surface px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setDraft({ minPrice: "", maxPrice: "", inStock: false, featured: false, options: [] })}
          >
            Reset
          </Button>
          <Button
            className="flex-[2]"
            onClick={() => {
              if (commit(draft)) onApplied?.();
            }}
          >
            Show results
          </Button>
        </div>
      )}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-sm text-ink">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-coral-600" : "bg-line-strong",
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-5 rounded-full bg-white shadow-sm transition-[left]",
            checked ? "left-6" : "left-1",
          )}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
