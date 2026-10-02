import { Prisma } from '@prisma/client';
import { toNumber, toNumberOrNull } from '../common/utils/money';
import { telUrl, whatsappUrl } from '../common/utils/phone';
import { ORDER_TRANSITIONS } from './order-status';

export const orderDetailInclude = {
  items: { orderBy: { createdAt: 'asc' } },
  history: { orderBy: { createdAt: 'asc' } },
  customer: { select: { id: true, registeredAt: true } },
} satisfies Prisma.OrderInclude;

export type OrderDetailRow = Prisma.OrderGetPayload<{ include: typeof orderDetailInclude }>;

export const orderListSelect = {
  id: true,
  orderNumber: true,
  status: true,
  paymentStatus: true,
  customerName: true,
  customerPhone: true,
  city: true,
  itemsCount: true,
  total: true,
  createdAt: true,
  updatedAt: true,
  items: { select: { productName: true }, orderBy: { createdAt: 'asc' }, take: 3 },
} satisfies Prisma.OrderSelect;

export type OrderListRow = Prisma.OrderGetPayload<{ select: typeof orderListSelect }>;

function itemOptions(value: Prisma.JsonValue | null): { name: string; value: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => v as { name?: unknown; value?: unknown })
    .filter((v) => typeof v?.name === 'string' && typeof v?.value === 'string')
    .map((v) => ({ name: v.name as string, value: v.value as string }));
}

function publicItem(item: OrderDetailRow['items'][number]) {
  return {
    productName: item.productName,
    productSlug: item.productSlug,
    variantTitle: item.variantTitle,
    options: itemOptions(item.options),
    imageUrl: item.imageUrl,
    sku: item.sku,
    quantity: item.quantity,
    unitMrp: toNumber(item.unitMrp),
    unitPrice: toNumber(item.unitPrice),
    lineTotal: toNumber(item.lineTotal),
  };
}

/** Customer-facing order (confirmation + tracking). */
export function toPublicOrder(order: OrderDetailRow) {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    alternatePhone: order.alternatePhone,
    customerEmail: order.customerEmail,
    address: order.address,
    city: order.city,
    state: order.state,
    pincode: order.pincode,
    landmark: order.landmark,
    googleMapsLink: order.googleMapsLink,
    locationLink: order.locationLink,
    customerNote: order.customerNote,
    items: order.items.map(publicItem),
    itemsCount: order.itemsCount,
    subtotal: toNumber(order.subtotal),
    discount: toNumber(order.discount),
    shippingFee: toNumber(order.shippingFee),
    total: toNumber(order.total),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    history: order.history.map((h) => ({ status: h.toStatus, createdAt: h.createdAt })),
  };
}

export function mapsUrlFor(order: Pick<OrderDetailRow, 'googleMapsLink' | 'locationLink' | 'latitude' | 'longitude' | 'address' | 'city' | 'state' | 'pincode'>) {
  if (order.googleMapsLink) return order.googleMapsLink;
  if (order.locationLink) return order.locationLink;
  if (order.latitude !== null && order.longitude !== null) {
    return `https://www.google.com/maps?q=${toNumber(order.latitude)},${toNumber(order.longitude)}`;
  }
  const query = [order.address, order.city, order.state, order.pincode].filter(Boolean).join(', ');
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}

export function toAdminOrderDetail(order: OrderDetailRow, storeName: string, customerOrdersCount: number) {
  const base = toPublicOrder(order);
  const greeting = `Hi ${order.customerName.split(' ')[0]}, this is ${storeName} regarding your order ${order.orderNumber}.`;
  return {
    ...base,
    id: order.id,
    customerId: order.customerId,
    latitude: toNumberOrNull(order.latitude),
    longitude: toNumberOrNull(order.longitude),
    adminNote: order.adminNote,
    confirmedAt: order.confirmedAt,
    deliveredAt: order.deliveredAt,
    cancelledAt: order.cancelledAt,
    stockRestored: order.stockRestored,
    updatedAt: order.updatedAt,
    items: order.items.map((item) => ({
      ...publicItem(item),
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      categoryName: item.categoryName,
    })),
    history: order.history.map((h) => ({
      id: h.id,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      note: h.note,
      changedByName: h.changedByName,
      createdAt: h.createdAt,
    })),
    allowedTransitions: ORDER_TRANSITIONS[order.status],
    contact: {
      callUrl: telUrl(order.customerPhone)!,
      whatsappUrl: whatsappUrl(order.customerPhone, greeting)!,
      alternateCallUrl: telUrl(order.alternatePhone),
      mapsUrl: mapsUrlFor(order),
    },
    customerOrdersCount,
    /** The order shows up under "My orders" of a customer account. */
    linkedToAccount: order.accountLinkedAt !== null,
    /** The customer record behind this order has a registered account. */
    customerHasAccount: !!order.customer?.registeredAt,
  };
}

export function toAdminOrderListItem(row: OrderListRow) {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    paymentStatus: row.paymentStatus,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    city: row.city,
    itemsCount: row.itemsCount,
    total: toNumber(row.total),
    itemsPreview: row.items.map((i) => i.productName),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ─── Customer account views ───────────────────────────────────

export const customerOrderListSelect = {
  id: true,
  orderNumber: true,
  status: true,
  itemsCount: true,
  total: true,
  paymentMethod: true,
  paymentStatus: true,
  createdAt: true,
  deliveredAt: true,
  items: { select: { productName: true, imageUrl: true, quantity: true }, orderBy: { createdAt: 'asc' }, take: 4 },
  _count: { select: { items: true } },
} satisfies Prisma.OrderSelect;

export type CustomerOrderListRow = Prisma.OrderGetPayload<{ select: typeof customerOrderListSelect }>;

export function toCustomerOrderListItem(row: CustomerOrderListRow) {
  return {
    orderNumber: row.orderNumber,
    status: row.status,
    itemsCount: row.itemsCount,
    linesCount: row._count.items,
    total: toNumber(row.total),
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    createdAt: row.createdAt,
    deliveredAt: row.deliveredAt,
    itemsPreview: row.items.map((i) => ({ productName: i.productName, imageUrl: i.imageUrl, quantity: i.quantity })),
  };
}

export interface ItemReviewState {
  review: { id: string; rating: number; comment: string | null; status: string; createdAt: Date; updatedAt: Date } | null;
  canReview: boolean;
}

/**
 * Detailed order for its owner. Review eligibility is computed by the API (never the client):
 * see ReviewsService.reviewStateForOrder.
 */
export function toCustomerOrderDetail(order: OrderDetailRow, reviewState: (productId: string | null) => ItemReviewState) {
  const base = toPublicOrder(order);
  return {
    ...base,
    deliveredAt: order.deliveredAt,
    cancelledAt: order.cancelledAt,
    items: order.items.map((item) => ({ ...publicItem(item), productId: item.productId, ...reviewState(item.productId) })),
    canCancel: order.status === 'PENDING',
    documents: { invoice: order.status !== 'CANCELLED', receipt: true },
  };
}
