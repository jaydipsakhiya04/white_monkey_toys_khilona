import { cache } from "react";
import { serverGet } from "@/lib/api/server";
import { ApiError } from "@/lib/api/errors";
import type {
  CategoryDetail,
  CategorySummary,
  Paginated,
  ProductCard,
  ProductDetail,
  ProductFacets,
  ProductQuery,
  PublicStore,
  SitemapData,
} from "@/types/api";

/** Store info; returns null when the API is unreachable so layout can still render. */
export const getStore = cache(async (): Promise<PublicStore | null> => {
  try {
    return await serverGet<PublicStore>("/store");
  } catch {
    return null;
  }
});

/** Category tree; null when API unavailable. */
export const getCategoryTree = cache(async (): Promise<CategorySummary[] | null> => {
  try {
    return await serverGet<CategorySummary[]>("/categories");
  } catch {
    return null;
  }
});

/** Returns null on 404, throws ApiError otherwise. */
export const getCategory = cache(async (slug: string): Promise<CategoryDetail | null> => {
  try {
    return await serverGet<CategoryDetail>(`/categories/${encodeURIComponent(slug)}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
});

/** Returns null on 404, throws ApiError otherwise. */
export const getProduct = cache(async (slug: string): Promise<ProductDetail | null> => {
  try {
    return await serverGet<ProductDetail>(`/products/${encodeURIComponent(slug)}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
});

export function getProducts(query: ProductQuery) {
  return serverGet<Paginated<ProductCard>>("/products", query);
}

export function getFacets(query: { category?: string; search?: string }) {
  return serverGet<ProductFacets>("/products/facets", query);
}

export async function getRelatedProducts(slug: string, limit = 8): Promise<ProductCard[]> {
  try {
    return await serverGet<ProductCard[]>(`/products/${encodeURIComponent(slug)}/related`, { limit });
  } catch {
    return [];
  }
}

export function getSitemapData() {
  return serverGet<SitemapData>("/sitemap", undefined, 600);
}
