import type { OrderStatus, PaymentStatus, StockStatus } from '@/types/api';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  READY: 'Ready',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

/** Tailwind classes for order status badges and dots. */
export const ORDER_STATUS_STYLE: Record<OrderStatus, { badge: string; dot: string }> = {
  PENDING: { badge: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  CONFIRMED: { badge: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-500' },
  PROCESSING: { badge: 'bg-violet-50 text-violet-700 ring-violet-200', dot: 'bg-violet-500' },
  READY: { badge: 'bg-teal-50 text-teal-700 ring-teal-200', dot: 'bg-teal-500' },
  OUT_FOR_DELIVERY: { badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200', dot: 'bg-indigo-500' },
  DELIVERED: { badge: 'bg-green-50 text-green-700 ring-green-200', dot: 'bg-green-600' },
  CANCELLED: { badge: 'bg-stone-100 text-red-700 ring-stone-300', dot: 'bg-red-500' },
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  UNPAID: 'Unpaid',
  PAID: 'Paid',
  REFUNDED: 'Refunded',
};

export const PAYMENT_STATUS_STYLE: Record<PaymentStatus, string> = {
  UNPAID: 'bg-stone-50 text-stone-600 ring-stone-200',
  PAID: 'bg-green-50 text-green-700 ring-green-200',
  REFUNDED: 'bg-sky-50 text-sky-700 ring-sky-200',
};

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  IN_STOCK: 'In stock',
  LOW_STOCK: 'Low stock',
  OUT_OF_STOCK: 'Out of stock',
};

export const STOCK_STATUS_STYLE: Record<StockStatus, string> = {
  IN_STOCK: 'bg-green-50 text-green-700 ring-green-200',
  LOW_STOCK: 'bg-amber-50 text-amber-800 ring-amber-200',
  OUT_OF_STOCK: 'bg-red-50 text-red-700 ring-red-200',
};

/** Statuses that need an explicit confirmation step before being applied. */
export const CONFIRM_REQUIRED_STATUSES: OrderStatus[] = ['CANCELLED', 'DELIVERED'];

/**
 * Display-only copy of the contract transition table. Used ONLY to pre-render the
 * quick "change status" menu on list rows; the backend remains the source of truth
 * (detail pages use `allowedTransitions` and the server rejects invalid moves with 409).
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
