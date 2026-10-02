/**
 * Customer-facing brand. The store name normally comes from the API (store settings);
 * this is only the fallback when the API is unreachable. "Khilona" is the internal project name
 * and must never appear in customer-facing UI or SEO.
 */
export const BRAND_NAME = "White Monkey Toys";

/** Store name for display, with the brand as fallback. */
export function brandName(store: { name?: string | null } | null | undefined): string {
  return store?.name?.trim() || BRAND_NAME;
}

/** Prefix used in the visual order number examples (backend: ORDER_NUMBER_PREFIX). */
export const ORDER_NUMBER_EXAMPLE = "WMT-20261002-0001";

/** Order numbers: PREFIX-YYYYMMDD-NNNN (older orders may use a different prefix). */
export const ORDER_NUMBER_PATTERN = /^[A-Z]{2,6}-\d{8}-\d{3,}$/i;
