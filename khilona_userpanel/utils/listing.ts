import type { ProductQuery, ProductSort } from "@/types/api";

export const PAGE_SIZE = 24;

export const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
];

const SORTS = new Set(SORT_OPTIONS.map((s) => s.value));

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function num(v: string | undefined): number | undefined {
  if (v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Listing state that lives in the URL. */
export type ListingParams = {
  search?: string;
  sort: ProductSort;
  page: number;
  minPrice?: number;
  maxPrice?: number;
  inStock: boolean;
  featured: boolean;
  /** "Color:Red,Age:3+" */
  options: string[];
};

export function parseListingParams(sp: RawSearchParams): ListingParams {
  const sort = first(sp.sort) as ProductSort | undefined;
  const page = Math.max(1, Math.floor(num(first(sp.page)) ?? 1));
  const opts = (first(sp.options) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.includes(":"));
  const search = first(sp.search)?.trim();
  return {
    search: search ? search.slice(0, 100) : undefined,
    sort: sort && SORTS.has(sort) ? sort : "featured",
    page,
    minPrice: num(first(sp.minPrice)),
    maxPrice: num(first(sp.maxPrice)),
    inStock: first(sp.inStock) === "true",
    featured: first(sp.featured) === "true",
    options: opts,
  };
}

export function toProductQuery(p: ListingParams, category?: string): ProductQuery {
  return {
    category,
    search: p.search,
    sort: p.sort,
    page: p.page,
    limit: PAGE_SIZE,
    minPrice: p.minPrice,
    maxPrice: p.maxPrice,
    inStock: p.inStock || undefined,
    featured: p.featured || undefined,
    options: p.options.length ? p.options.join(",") : undefined,
  };
}

export function countActiveFilters(p: ListingParams): number {
  return (
    (p.minPrice !== undefined || p.maxPrice !== undefined ? 1 : 0) +
    (p.inStock ? 1 : 0) +
    (p.featured ? 1 : 0) +
    p.options.length
  );
}
