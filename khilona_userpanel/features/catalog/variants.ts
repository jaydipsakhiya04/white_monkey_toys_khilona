import type { ProductDetail, ProductOptionGroup, ProductVariant } from "@/types/api";

/** groupId → selected valueId */
export type Selection = Record<string, string | undefined>;

export function sortedGroups(product: Pick<ProductDetail, "options">): ProductOptionGroup[] {
  return [...product.options]
    .sort((a, b) => a.position - b.position)
    .map((g) => ({ ...g, values: [...g.values].sort((a, b) => a.position - b.position) }));
}

function matches(variant: ProductVariant, selection: Selection, ignoreGroup?: string): boolean {
  return Object.entries(selection).every(([groupId, valueId]) => {
    if (!valueId || groupId === ignoreGroup) return true;
    return variant.optionValueIds.includes(valueId);
  });
}

/** Variant matching every group, or null while incomplete / no such combination. */
export function resolveVariant(product: Pick<ProductDetail, "variants">, groups: ProductOptionGroup[], selection: Selection): ProductVariant | null {
  if (groups.length === 0) return null;
  if (groups.some((g) => !selection[g.id])) return null;
  return product.variants.find((v) => matches(v, selection)) ?? null;
}

export type ValueState = "available" | "conflict" | "out-of-stock" | "unavailable";

/**
 * - available: an in-stock variant exists with this value + the other current selections
 * - conflict: in stock only with a different selection in another group (still clickable)
 * - out-of-stock: combination exists but no stock anywhere
 * - unavailable: value is not sold at all
 */
export function valueState(variants: ProductVariant[], selection: Selection, groupId: string, valueId: string): ValueState {
  const withValue = variants.filter((v) => v.optionValueIds.includes(valueId));
  if (withValue.length === 0) return "unavailable";
  const compatible = withValue.filter((v) => matches(v, selection, groupId));
  if (compatible.some((v) => v.inStock && v.stock > 0)) return "available";
  if (withValue.some((v) => v.inStock && v.stock > 0)) return "conflict";
  return "out-of-stock";
}

/** Select a value; drop selections in other groups that no longer form a sellable combination. */
export function selectValue(variants: ProductVariant[], groups: ProductOptionGroup[], selection: Selection, groupId: string, valueId: string): Selection {
  const next: Selection = { ...selection, [groupId]: valueId };
  const ok = (sel: Selection) => variants.some((v) => matches(v, sel) && v.inStock && v.stock > 0);
  if (ok(next)) return next;
  // remove other selections one by one until a sellable combination remains
  for (const g of groups) {
    if (g.id === groupId) continue;
    if (next[g.id]) {
      delete next[g.id];
      if (ok(next)) return next;
    }
  }
  return next;
}

/** Initial selection: auto-pick groups that only have one value. */
export function initialSelection(groups: ProductOptionGroup[]): Selection {
  const sel: Selection = {};
  for (const g of groups) if (g.values.length === 1) sel[g.id] = g.values[0].id;
  return sel;
}

/** Image to show for the current partial selection (first matching variant with an image). */
export function selectionImage(variants: ProductVariant[], selection: Selection): string | null {
  if (!Object.values(selection).some(Boolean)) return null;
  return variants.find((v) => v.imageUrl && matches(v, selection))?.imageUrl ?? null;
}
