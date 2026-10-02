import { Prisma } from '@prisma/client';
import { DecimalLike, discountPercent, toNumber, toNumberOrNull } from '../common/utils/money';

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface ResolvedPrice {
  price: number;
  salePrice: number | null;
  effectivePrice: number;
  discountPercent: number;
}

/** A sale price only counts when it is positive and lower than the regular price. */
export function resolvePrice(price: DecimalLike, salePrice: DecimalLike): ResolvedPrice {
  const p = toNumber(price);
  const s = toNumberOrNull(salePrice);
  const validSale = s !== null && s > 0 && s < p ? s : null;
  return {
    price: p,
    salePrice: validSale,
    effectivePrice: validSale ?? p,
    discountPercent: discountPercent(p, validSale),
  };
}

/**
 * Variant pricing rules:
 * - variant.price set   → use variant.price / variant.salePrice
 * - variant.price null  → inherit product.price; use variant.salePrice if set, else product.salePrice
 */
export function resolveVariantPrice(
  product: { price: DecimalLike; salePrice: DecimalLike },
  variant: { price: DecimalLike; salePrice: DecimalLike },
): ResolvedPrice {
  if (variant.price !== null && variant.price !== undefined) return resolvePrice(variant.price, variant.salePrice);
  return resolvePrice(product.price, variant.salePrice ?? product.salePrice);
}

export function stockStatus(stock: number, lowStockThreshold: number): StockStatus {
  if (stock <= 0) return 'OUT_OF_STOCK';
  if (stock <= lowStockThreshold) return 'LOW_STOCK';
  return 'IN_STOCK';
}

/**
 * Recomputes the denormalised columns used for listing/filtering:
 * stock (sum of active variants), minPrice and maxPrice (effective prices).
 * Must be called after any change to a product's price, variants or stock.
 */
export async function recomputeProductAggregates(tx: Prisma.TransactionClient, productId: string) {
  const product = await tx.product.findUnique({
    where: { id: productId },
    select: {
      price: true,
      salePrice: true,
      hasVariants: true,
      stock: true,
      variants: { where: { isActive: true }, select: { price: true, salePrice: true, stock: true } },
    },
  });
  if (!product) return;

  const own = resolvePrice(product.price, product.salePrice).effectivePrice;
  let minPrice = own;
  let maxPrice = own;
  let stock = product.stock;

  if (product.hasVariants) {
    stock = product.variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0);
    if (product.variants.length) {
      const prices = product.variants.map((v) => resolveVariantPrice(product, v).effectivePrice);
      minPrice = Math.min(...prices);
      maxPrice = Math.max(...prices);
    }
  }

  await tx.product.update({ where: { id: productId }, data: { stock, minPrice, maxPrice } });
}
