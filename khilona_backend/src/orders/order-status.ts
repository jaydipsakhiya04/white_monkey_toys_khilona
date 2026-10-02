import { OrderStatus } from '@prisma/client';

/**
 * Allowed order status transitions. Orders only move forward (steps may be skipped,
 * e.g. READY → DELIVERED for in-store pickup). DELIVERED and CANCELLED are final.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'READY', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  PROCESSING: ['READY', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  READY: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  READY: 'Ready',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const canTransition = (from: OrderStatus, to: OrderStatus) => ORDER_TRANSITIONS[from].includes(to);
