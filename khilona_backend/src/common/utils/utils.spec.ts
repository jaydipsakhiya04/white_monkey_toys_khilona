import { resolvePrice, resolveVariantPrice, stockStatus } from '../../products/pricing';
import { canTransition, ORDER_TRANSITIONS } from '../../orders/order-status';
import { parseDurationToSeconds } from './duration';
import { normalizeIndianMobile, telUrl, whatsappUrl } from './phone';
import { slugify, uniqueSlug } from './slug';
import { compactDateInZone, isoDateInZone, startOfDayInZone } from './time';

describe('slugify', () => {
  it.each([
    ['Remote Control Car', 'remote-control-car'],
    ['  Toys & Games!! ', 'toys-and-games'],
    ['Speed Cube 3×3', 'speed-cube-3-3'],
    ['Café Crème', 'cafe-creme'],
  ])('%s → %s', (input, expected) => expect(slugify(input)).toBe(expected));

  it('makes slugs unique', async () => {
    const taken = new Set(['car', 'car-2']);
    expect(await uniqueSlug('Car', async (s) => taken.has(s))).toBe('car-3');
  });
});

describe('phone helpers', () => {
  it.each(['9876543210', '+91 98765 43210', '09876543210', '91-9876543210'])('normalises %s', (input) =>
    expect(normalizeIndianMobile(input)).toBe('9876543210'),
  );
  it.each(['12345', '5876543210', '98765432101', ''])('rejects %s', (input) => expect(normalizeIndianMobile(input)).toBeNull());
  it('builds contact links', () => {
    expect(telUrl('9876543210')).toBe('tel:+919876543210');
    expect(whatsappUrl('9876543210', 'Hi there')).toBe('https://wa.me/919876543210?text=Hi%20there');
  });
});

describe('pricing', () => {
  it('ignores invalid sale prices', () => {
    expect(resolvePrice(100, 120)).toMatchObject({ salePrice: null, effectivePrice: 100, discountPercent: 0 });
    expect(resolvePrice(1499, 1199)).toMatchObject({ salePrice: 1199, effectivePrice: 1199, discountPercent: 20 });
  });
  it('resolves variant overrides', () => {
    const product = { price: 1000, salePrice: 900 };
    expect(resolveVariantPrice(product, { price: null, salePrice: null }).effectivePrice).toBe(900);
    expect(resolveVariantPrice(product, { price: 1200, salePrice: null }).effectivePrice).toBe(1200);
    expect(resolveVariantPrice(product, { price: null, salePrice: 850 }).effectivePrice).toBe(850);
  });
  it('derives stock status', () => {
    expect(stockStatus(0, 5)).toBe('OUT_OF_STOCK');
    expect(stockStatus(5, 5)).toBe('LOW_STOCK');
    expect(stockStatus(6, 5)).toBe('IN_STOCK');
  });
});

describe('order status transitions', () => {
  it('only moves forward and closes on DELIVERED / CANCELLED', () => {
    expect(canTransition('PENDING', 'CONFIRMED')).toBe(true);
    expect(canTransition('PENDING', 'DELIVERED')).toBe(false);
    expect(canTransition('READY', 'DELIVERED')).toBe(true);
    expect(canTransition('DELIVERED', 'CANCELLED')).toBe(false);
    expect(ORDER_TRANSITIONS.CANCELLED).toEqual([]);
  });
});

describe('time helpers (Asia/Kolkata)', () => {
  const tz = 'Asia/Kolkata';
  it('uses the store day for order numbers', () => {
    // 20:00 UTC on Oct 1 is 01:30 IST on Oct 2.
    const instant = new Date('2026-10-01T20:00:00Z');
    expect(compactDateInZone(instant, tz)).toBe('20261002');
    expect(isoDateInZone(instant, tz)).toBe('2026-10-02');
  });
  it('computes local midnight', () => {
    expect(startOfDayInZone('2026-10-02', tz).toISOString()).toBe('2026-10-01T18:30:00.000Z');
  });
  it('parses durations', () => {
    expect(parseDurationToSeconds('15m')).toBe(900);
    expect(parseDurationToSeconds('900')).toBe(900);
    expect(parseDurationToSeconds('abc')).toBeNull();
  });
});
