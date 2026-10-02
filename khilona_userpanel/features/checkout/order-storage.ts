import type { PublicOrder } from "@/types/api";

const key = (orderNumber: string) => `khilona-order-${orderNumber}`;

/** Stash the order returned by POST /orders so the success page can render it. */
export function saveOrderSnapshot(order: PublicOrder) {
  try {
    sessionStorage.setItem(key(order.orderNumber), JSON.stringify(order));
  } catch {
    // ignore (private mode / quota)
  }
}

export function readOrderSnapshot(orderNumber: string): PublicOrder | null {
  try {
    const raw = sessionStorage.getItem(key(orderNumber));
    if (!raw) return null;
    const order = JSON.parse(raw) as PublicOrder;
    return order?.orderNumber === orderNumber ? order : null;
  } catch {
    return null;
  }
}
