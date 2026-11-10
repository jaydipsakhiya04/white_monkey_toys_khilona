import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { from, mergeMap, Observable } from 'rxjs';
import { StoreService } from '../../stores/store.service';

/** Money fields that must never leave the API while prices are hidden. */
const MONEY_KEYS = new Set([
  'price',
  'salePrice',
  'effectivePrice',
  'discountPercent',
  'minPrice',
  'maxPrice',
  'unitMrp',
  'unitPrice',
  'lineTotal',
  'subtotal',
  'discount',
  'shippingFee',
  'total',
  'priceRange',
]);

/** Pagination metadata uses `total` for a count, not money. */
const SKIP_KEYS = new Set(['meta']);

export function redactPrices(value: unknown): unknown {
  if (value === null || value === undefined || typeof value !== 'object') return value;
  if (value instanceof Date || Buffer.isBuffer(value)) return value;
  if (Array.isArray(value)) return value.map(redactPrices);
  // Prisma Decimal and other class instances with no plain keys are left to the serializer
  if (Object.getPrototypeOf(value) !== Object.prototype) return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SKIP_KEYS.has(k)) out[k] = v;
    else if (MONEY_KEYS.has(k)) out[k] = null;
    else out[k] = redactPrices(v);
  }
  return out;
}

/**
 * While the store setting `showPrices` is off, every public and customer response is stripped of
 * prices and totals ("Ask for price" on the storefront). Admin routes always see real prices, and
 * orders are still priced server-side from live data.
 */
@Injectable()
export class PriceVisibilityInterceptor implements NestInterceptor {
  constructor(private readonly store: StoreService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const req = context.switchToHttp().getRequest<Request>();
    const path = req.originalUrl;
    if (/^\/api\/(admin|auth\/(login|logout|refresh|me))(\/|\?|$)/.test(path)) return next.handle();
    return next.handle().pipe(
      mergeMap((data) =>
        from(
          this.store.pricesVisible().then((visible) => (visible ? data : redactPrices(data))),
        ),
      ),
    );
  }
}
