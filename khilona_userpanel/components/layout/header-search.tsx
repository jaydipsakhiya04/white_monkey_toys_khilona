"use client";

import Link from "next/link";
import { ArrowUpRight, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { api } from "@/lib/api/client";
import type { Paginated, ProductCard } from "@/types/api";
import { cn } from "@/utils/cn";
import { formatPrice } from "@/utils/format";

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Search with instant product suggestions (combobox pattern; Enter searches the full catalogue). */
export function SearchForm({
  className,
  autoFocus,
  onSubmitted,
  inputClassName,
}: {
  className?: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
  inputClassName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = pathname === "/products" ? (params.get("search") ?? "") : "";
  const [value, setValue] = useState(current);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const id = useId();
  const listId = `${id}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLFormElement>(null);
  const q = useDebounced(value.trim(), 200);

  // keep in sync when navigating between searches
  useEffect(() => {
    setValue(current);
  }, [current]);
  useEffect(() => setOpen(false), [pathname, params]);

  const suggestions = useQuery({
    queryKey: ["search-suggest", q],
    queryFn: () => api.get<Paginated<ProductCard>>("/products", { search: q, limit: 5, sort: "featured" }),
    enabled: q.length >= 2,
    staleTime: 60_000,
  });
  const items = q.length >= 2 ? (suggestions.data?.items ?? []) : [];
  const showPanel = open && q.length >= 2;

  useEffect(() => setActive(-1), [q]);

  function go(href: string) {
    router.push(href);
    setOpen(false);
    inputRef.current?.blur();
    onSubmitted?.();
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (active >= 0 && items[active]) return go(`/product/${items[active].slug}`);
    const term = value.trim();
    go(term ? `/products?search=${encodeURIComponent(term)}` : "/products");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!showPanel || items.length === 0) {
      if (e.key === "Escape") setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <form
      ref={wrapRef}
      role="search"
      onSubmit={submit}
      className={cn("relative", className)}
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[1.125rem] -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        ref={inputRef}
        id={id}
        type="search"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        enterKeyHint="search"
        autoComplete="off"
        autoFocus={autoFocus}
        data-autofocus={autoFocus ? "" : undefined}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search toys, games, gifts…"
        maxLength={100}
        className={cn(
          "h-11 w-full rounded-full border border-line bg-sand pl-10 pr-10 text-[0.9375rem] text-ink transition-colors placeholder:text-muted/80 hover:border-line-strong focus:border-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-ink/10 [&::-webkit-search-cancel-button]:hidden",
          inputClassName,
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            inputRef.current?.focus();
          }}
          className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-sand-deep hover:text-ink"
          aria-label="Clear search"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}

      {showPanel && (
        <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 animate-pop-in overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
          <ul id={listId} role="listbox" aria-label="Suggestions" className="max-h-[60vh] overflow-y-auto p-1.5">
            {items.map((p, i) => (
              <li key={p.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                <Link
                  href={`/product/${p.slug}`}
                  tabIndex={-1}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => {
                    setOpen(false);
                    onSubmitted?.();
                  }}
                  className={cn("flex items-center gap-3 rounded-xl p-2", i === active ? "bg-sand" : "hover:bg-sand")}
                >
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-sand">
                    <SmartImage src={p.thumbnailUrl} alt="" fill sizes="44px" className="object-contain p-1" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{p.name}</span>
                    <span className="block truncate text-xs text-muted">{p.category.name}</span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-ink">{formatPrice(p.hasVariants ? p.minPrice : p.effectivePrice)}</span>
                </Link>
              </li>
            ))}
            {suggestions.isFetching && items.length === 0 && <li className="px-3 py-3 text-sm text-muted">Searching…</li>}
            {!suggestions.isFetching && suggestions.isSuccess && items.length === 0 && (
              <li className="px-3 py-3 text-sm text-muted">No toys match “{q}”. Try a different word.</li>
            )}
          </ul>
          <button
            type="submit"
            className="flex w-full items-center justify-between border-t border-line px-4 py-3 text-left text-sm font-semibold text-ink hover:bg-sand"
          >
            <span className="truncate">See all results for “{q}”</span>
            <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
          </button>
        </div>
      )}
    </form>
  );
}
