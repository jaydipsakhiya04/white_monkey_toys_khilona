import { Prisma } from '@prisma/client';
import { toNumber, toNumberOrNull } from '../common/utils/money';
import { resolvePrice, resolveVariantPrice, stockStatus } from './pricing';

// ─── Prisma selections ───────────────────────────────────────

export const cardSelect = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  thumbnailUrl: true,
  price: true,
  salePrice: true,
  minPrice: true,
  maxPrice: true,
  stock: true,
  lowStockThreshold: true,
  isFeatured: true,
  hasVariants: true,
  ratingAvg: true,
  ratingCount: true,
  createdAt: true,
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductSelect;

export type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

export const variantInclude = {
  optionValues: {
    include: { optionValue: { include: { option: { select: { name: true, position: true } } } } },
  },
} satisfies Prisma.ProductVariantInclude;

export const detailInclude = {
  category: { select: { id: true, name: true, slug: true, parent: { select: { id: true, name: true, slug: true } } } },
  images: { orderBy: { position: 'asc' } },
  options: { orderBy: { position: 'asc' }, include: { values: { orderBy: { position: 'asc' } } } },
  variants: { orderBy: { position: 'asc' }, include: variantInclude },
} satisfies Prisma.ProductInclude;

export type DetailRow = Prisma.ProductGetPayload<{ include: typeof detailInclude }>;
type VariantRow = DetailRow['variants'][number];

export const adminListSelect = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  thumbnailUrl: true,
  price: true,
  salePrice: true,
  stock: true,
  lowStockThreshold: true,
  isActive: true,
  isFeatured: true,
  hasVariants: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true } },
  _count: { select: { variants: true } },
} satisfies Prisma.ProductSelect;

export type AdminListRow = Prisma.ProductGetPayload<{ select: typeof adminListSelect }>;

// ─── Helpers ─────────────────────────────────────────────────

export type Specification = { label: string; value: string };

export function parseSpecifications(value: Prisma.JsonValue | null): Specification[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((row): row is { label: string; value: string } => {
      const r = row as Record<string, unknown> | null;
      return !!r && typeof r.label === 'string' && typeof r.value === 'string';
    })
    .map((r) => ({ label: r.label, value: r.value }));
}

/** Ordered option name → value map of a variant, e.g. { Color: "Red", Size: "Large" }. */
export function variantOptions(variant: VariantRow): Record<string, string> {
  return Object.fromEntries(
    [...variant.optionValues]
      .sort((a, b) => a.optionValue.option.position - b.optionValue.option.position)
      .map((ov) => [ov.optionValue.option.name, ov.optionValue.value]),
  );
}

// ─── Public mappers ──────────────────────────────────────────

export function toProductCard(row: CardRow) {
  const pricing = resolvePrice(row.price, row.salePrice);
  const minPrice = row.hasVariants ? toNumber(row.minPrice) : pricing.effectivePrice;
  const maxPrice = row.hasVariants ? toNumber(row.maxPrice) : pricing.effectivePrice;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    shortDescription: row.shortDescription,
    thumbnailUrl: row.thumbnailUrl,
    ...pricing,
    minPrice,
    maxPrice,
    stock: row.stock,
    inStock: row.stock > 0,
    stockStatus: stockStatus(row.stock, row.lowStockThreshold),
    isFeatured: row.isFeatured,
    hasVariants: row.hasVariants,
    category: row.category,
    /** Published verified-purchase reviews (average 0 when none). */
    rating: { average: toNumber(row.ratingAvg), count: row.ratingCount },
    createdAt: row.createdAt,
  };
}

export function toProductDetail(row: DetailRow) {
  const card = toProductCard(row);
  const activeVariants = row.variants.filter((v) => v.isActive);
  return {
    ...card,
    description: row.description,
    sku: row.sku,
    specifications: parseSpecifications(row.specifications),
    images: row.images.map((img) => ({ id: img.id, url: img.url, alt: img.alt, position: img.position })),
    options: row.hasVariants
      ? row.options.map((o) => ({
          id: o.id,
          name: o.name,
          position: o.position,
          values: o.values.map((v) => ({ id: v.id, value: v.value, position: v.position })),
        }))
      : [],
    variants: row.hasVariants
      ? activeVariants.map((v) => {
          const pricing = resolveVariantPrice(row, v);
          return {
            id: v.id,
            title: v.title,
            sku: v.sku,
            ...pricing,
            stock: v.stock,
            inStock: v.stock > 0,
            imageUrl: v.imageUrl,
            optionValueIds: v.optionValues.map((ov) => ov.optionValueId),
            options: variantOptions(v),
          };
        })
      : [],
    category: row.category,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    updatedAt: row.updatedAt,
  };
}

// ─── Admin mappers ───────────────────────────────────────────

export function toAdminListItem(row: AdminListRow) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    thumbnailUrl: row.thumbnailUrl,
    price: toNumber(row.price),
    salePrice: toNumberOrNull(row.salePrice),
    stock: row.stock,
    stockStatus: stockStatus(row.stock, row.lowStockThreshold),
    lowStockThreshold: row.lowStockThreshold,
    isActive: row.isActive,
    isFeatured: row.isFeatured,
    hasVariants: row.hasVariants,
    variantsCount: row._count.variants,
    sortOrder: row.sortOrder,
    category: row.category,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toAdminDetail(row: DetailRow, ordersCount: number) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    thumbnailUrl: row.thumbnailUrl,
    price: toNumber(row.price),
    salePrice: toNumberOrNull(row.salePrice),
    stock: row.stock,
    stockStatus: stockStatus(row.stock, row.lowStockThreshold),
    lowStockThreshold: row.lowStockThreshold,
    isActive: row.isActive,
    isFeatured: row.isFeatured,
    hasVariants: row.hasVariants,
    variantsCount: row.variants.length,
    sortOrder: row.sortOrder,
    category: { id: row.category.id, name: row.category.name },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    shortDescription: row.shortDescription,
    description: row.description,
    specifications: parseSpecifications(row.specifications),
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    images: row.images.map((img) => ({ id: img.id, url: img.url, alt: img.alt, position: img.position })),
    options: row.options.map((o) => ({ name: o.name, values: o.values.map((v) => v.value) })),
    variants: row.variants.map((v) => ({
      id: v.id,
      title: v.title,
      options: variantOptions(v),
      sku: v.sku,
      price: toNumberOrNull(v.price),
      salePrice: toNumberOrNull(v.salePrice),
      stock: v.stock,
      imageUrl: v.imageUrl,
      isActive: v.isActive,
      position: v.position,
    })),
    ordersCount,
  };
}
