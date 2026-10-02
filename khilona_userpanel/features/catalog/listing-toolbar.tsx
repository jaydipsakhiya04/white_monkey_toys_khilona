"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import { NativeSelect } from "@/components/ui/field";
import { Sheet } from "@/components/ui/overlay";
import type { ProductFacets } from "@/types/api";
import { formatPrice, pluralize } from "@/utils/format";
import { SORT_OPTIONS, countActiveFilters, type ListingParams } from "@/utils/listing";
import { FilterPanel } from "./filter-panel";
import { useListingNav } from "./listing-nav";

export function ListingToolbar({
  current,
  total,
  facets,
  searchLabel,
  showCategories,
}: {
  current: ListingParams;
  total: number | null;
  facets: ProductFacets | null;
  searchLabel: string;
  showCategories?: boolean;
}) {
  const { update } = useListingNav();
  const [q, setQ] = useState(current.search ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);
  const searchId = useId();
  const sortId = useId();
  const activeCount = countActiveFilters(current);

  useEffect(() => setQ(current.search ?? ""), [current.search]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    update({ search: q.trim() || null });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <form role="search" onSubmit={onSearch} className="relative min-w-0 flex-1">
          <label htmlFor={searchId} className="sr-only">
            {searchLabel}
          </label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[1.125rem] -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            id={searchId}
            type="search"
            enterKeyHint="search"
            value={q}
            maxLength={100}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchLabel}
            className="h-11 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-20 text-[0.9375rem] placeholder:text-muted/80 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/25 [&::-webkit-search-cancel-button]:hidden"
          />
          {q && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQ("");
                if (current.search) update({ search: null });
              }}
              className="absolute right-[3.75rem] top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-sand"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-lg bg-ink px-3 text-sm font-semibold text-white hover:bg-ink/90"
          >
            Go
          </button>
        </form>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-haspopup="dialog"
            className="relative inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-4 text-sm font-semibold text-ink hover:bg-sand sm:flex-none lg:hidden"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filters
            {activeCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[0.6875rem] font-bold text-white">
                {activeCount}
              </span>
            )}
          </button>
          <div className="flex flex-1 items-center gap-2 sm:flex-none">
            <label htmlFor={sortId} className="sr-only sm:not-sr-only sm:whitespace-nowrap sm:text-sm sm:font-medium sm:text-muted">
              Sort by
            </label>
            <NativeSelect
              id={sortId}
              value={current.sort}
              onChange={(e) => update({ sort: e.target.value === "featured" ? null : e.target.value })}
              className="w-full text-sm sm:w-48"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {total !== null && (
          <p className="mr-1 text-sm text-muted" aria-live="polite">
            {pluralize(total, "product")}
            {current.search ? (
              <>
                {" "}
                for <span className="font-semibold text-ink">“{current.search}”</span>
              </>
            ) : null}
          </p>
        )}
        <ActiveFilterChips current={current} />
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        side="responsive"
        title="Filters"
        description={total !== null ? `${pluralize(total, "product")} match right now` : undefined}
      >
        <FilterPanel facets={facets} current={current} mode="sheet" showCategories={showCategories} onApplied={() => setSheetOpen(false)} />
      </Sheet>
    </div>
  );
}

function ActiveFilterChips({ current }: { current: ListingParams }) {
  const { update, clearFilters } = useListingNav();
  const chips: { label: string; onRemove: () => void }[] = [];

  if (current.minPrice !== undefined || current.maxPrice !== undefined) {
    const label =
      current.minPrice !== undefined && current.maxPrice !== undefined
        ? `${formatPrice(current.minPrice)} – ${formatPrice(current.maxPrice)}`
        : current.minPrice !== undefined
          ? `From ${formatPrice(current.minPrice)}`
          : `Up to ${formatPrice(current.maxPrice)}`;
    chips.push({ label, onRemove: () => update({ minPrice: null, maxPrice: null }) });
  }
  if (current.inStock) chips.push({ label: "In stock", onRemove: () => update({ inStock: null }) });
  if (current.featured) chips.push({ label: "Featured", onRemove: () => update({ featured: null }) });
  for (const token of current.options) {
    const [name, ...rest] = token.split(":");
    chips.push({
      label: `${name}: ${rest.join(":")}`,
      onRemove: () => {
        const remaining = current.options.filter((o) => o !== token);
        update({ options: remaining.length ? remaining.join(",") : null });
      },
    });
  }
  if (chips.length === 0) return null;

  return (
    <>
      <ul className="flex flex-wrap gap-2" aria-label="Active filters">
        {chips.map((c) => (
          <li key={c.label}>
            <button
              type="button"
              onClick={c.onRemove}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink/5 pl-3 pr-2 text-xs font-semibold text-ink hover:bg-ink/10"
              aria-label={`Remove filter ${c.label}`}
            >
              {c.label}
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={clearFilters} className="h-8 rounded-lg px-2 text-xs font-semibold text-ink hover:underline">
        Clear all
      </button>
    </>
  );
}
