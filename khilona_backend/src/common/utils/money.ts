import { Prisma } from '@prisma/client';

export type DecimalLike = Prisma.Decimal | number | string | null | undefined;

/** Converts Prisma Decimal (or numeric-ish) values to a JS number rounded to 2 decimals. */
export function toNumber(value: DecimalLike): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'number' ? value : Number(value.toString());
  return Math.round(n * 100) / 100;
}

export function toNumberOrNull(value: DecimalLike): number | null {
  return value === null || value === undefined ? null : toNumber(value);
}

/** Rounds to 2 decimals. */
export const roundMoney = (n: number) => Math.round(n * 100) / 100;

export function discountPercent(price: number, salePrice: number | null): number {
  if (!salePrice || salePrice >= price || price <= 0) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}
