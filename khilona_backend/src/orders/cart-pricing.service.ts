import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { roundMoney } from '../common/utils/money';
import { PrismaService } from '../database/prisma.service';
import { variantInclude, variantOptions } from '../products/product.mapper';
import { ResolvedPrice, resolvePrice, resolveVariantPrice } from '../products/pricing';

export const MAX_QTY_PER_LINE = 99;

export interface CartItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export type CartLineStatus = 'OK' | 'QUANTITY_ADJUSTED' | 'OUT_OF_STOCK' | 'UNAVAILABLE' | 'VARIANT_REQUIRED';

const productInclude = {
  category: { select: { name: true, isActive: true, parent: { select: { isActive: true } } } },
  variants: { include: variantInclude },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;
type VariantRow = ProductRow['variants'][number];

export interface EvaluatedLine {
  /** Index of the (first) matching item in the request, for error reporting. */
  index: number;
  productId: string;
  variantId: string | null;
  requestedQuantity: number;
  quantity: number;
  maxQuantity: number;
  status: CartLineStatus;
  message: string | null;
  product: { id: string; name: string; slug: string; thumbnailUrl: string | null; sku: string | null } | null;
  variant: { id: string; title: string; options: Record<string, string>; imageUrl: string | null } | null;
  unitMrp: number;
  unitPrice: number;
  lineTotal: number;
  /** Internal references (not serialised to clients). */
  _product?: ProductRow;
  _variant?: VariantRow;
}

export interface CartSummary {
  itemsCount: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
}

/**
 * Single source of truth for cart pricing and availability. Used by
 * POST /cart/validate and by order placement (inside the order transaction).
 */
@Injectable()
export class CartPricingService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluate(items: CartItemInput[], client: Prisma.TransactionClient | PrismaClient = this.prisma) {
    // Merge duplicate lines (same product + variant).
    const merged = new Map<string, { index: number; productId: string; variantId: string | null; quantity: number }>();
    items.forEach((item, index) => {
      const variantId = item.variantId || null;
      const key = `${item.productId}::${variantId ?? ''}`;
      const existing = merged.get(key);
      if (existing) existing.quantity += item.quantity;
      else merged.set(key, { index, productId: item.productId, variantId, quantity: item.quantity });
    });

    const productIds = [...new Set([...merged.values()].map((l) => l.productId))];
    const products = await client.product.findMany({ where: { id: { in: productIds } }, include: productInclude });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const lines: EvaluatedLine[] = [...merged.values()].map((input) =>
      this.evaluateLine(input, productMap.get(input.productId)),
    );

    const summary = this.summarise(lines);
    return { lines, summary, hasIssues: lines.some((l) => l.status !== 'OK') };
  }

  /** Strips internal fields for API responses. */
  toPublic(result: Awaited<ReturnType<CartPricingService['evaluate']>>) {
    return {
      items: result.lines.map(({ _product, _variant, index, ...line }) => line),
      summary: result.summary,
      hasIssues: result.hasIssues,
    };
  }

  private evaluateLine(
    input: { index: number; productId: string; variantId: string | null; quantity: number },
    product: ProductRow | undefined,
  ): EvaluatedLine {
    const base = {
      index: input.index,
      productId: input.productId,
      variantId: input.variantId,
      requestedQuantity: input.quantity,
    };
    const unavailable = (message: string, p: ProductRow | null = null, pricing?: ResolvedPrice): EvaluatedLine => ({
      ...base,
      quantity: 0,
      maxQuantity: 0,
      status: 'UNAVAILABLE',
      message,
      product: p ? this.productRef(p) : null,
      variant: null,
      unitMrp: pricing?.price ?? 0,
      unitPrice: pricing?.effectivePrice ?? 0,
      lineTotal: 0,
    });

    if (!product || product.deletedAt) return unavailable('This product is no longer available');

    const visible =
      product.isActive && product.category.isActive && (!product.category.parent || product.category.parent.isActive);
    if (!visible) return unavailable('This product is currently unavailable', product, resolvePrice(product.price, product.salePrice));

    let stock: number;
    let pricing: ResolvedPrice;
    let variant: VariantRow | undefined;

    if (product.hasVariants) {
      if (!input.variantId) {
        return {
          ...unavailable('Please choose options for this product', product, resolvePrice(product.price, product.salePrice)),
          status: 'VARIANT_REQUIRED',
        };
      }
      variant = product.variants.find((v) => v.id === input.variantId);
      if (!variant || !variant.isActive) {
        return unavailable('The selected option is no longer available', product, resolvePrice(product.price, product.salePrice));
      }
      stock = variant.stock;
      pricing = resolveVariantPrice(product, variant);
    } else {
      if (input.variantId) {
        return unavailable('The selected option is no longer available', product, resolvePrice(product.price, product.salePrice));
      }
      stock = product.stock;
      pricing = resolvePrice(product.price, product.salePrice);
    }

    const maxQuantity = Math.max(0, Math.min(stock, MAX_QTY_PER_LINE));
    let quantity = input.quantity;
    let status: CartLineStatus = 'OK';
    let message: string | null = null;

    if (maxQuantity === 0) {
      quantity = 0;
      status = 'OUT_OF_STOCK';
      message = 'Out of stock';
    } else if (input.quantity > maxQuantity) {
      quantity = maxQuantity;
      status = 'QUANTITY_ADJUSTED';
      message = stock < MAX_QTY_PER_LINE ? `Only ${maxQuantity} left in stock` : `Maximum ${MAX_QTY_PER_LINE} per order`;
    }

    return {
      ...base,
      quantity,
      maxQuantity,
      status,
      message,
      product: this.productRef(product),
      variant: variant
        ? { id: variant.id, title: variant.title, options: variantOptions(variant), imageUrl: variant.imageUrl }
        : null,
      unitMrp: pricing.price,
      unitPrice: pricing.effectivePrice,
      lineTotal: roundMoney(pricing.effectivePrice * quantity),
      _product: product,
      _variant: variant,
    };
  }

  private productRef(p: ProductRow) {
    return { id: p.id, name: p.name, slug: p.slug, thumbnailUrl: p.thumbnailUrl, sku: p.sku };
  }

  private summarise(lines: EvaluatedLine[]): CartSummary {
    let itemsCount = 0;
    let subtotal = 0;
    let discount = 0;
    for (const line of lines) {
      if (line.status !== 'OK' && line.status !== 'QUANTITY_ADJUSTED') continue;
      itemsCount += line.quantity;
      subtotal += line.unitMrp * line.quantity;
      discount += (line.unitMrp - line.unitPrice) * line.quantity;
    }
    subtotal = roundMoney(subtotal);
    discount = roundMoney(discount);
    const shippingFee = 0;
    return { itemsCount, subtotal, discount, shippingFee, total: roundMoney(subtotal - discount + shippingFee) };
  }
}
