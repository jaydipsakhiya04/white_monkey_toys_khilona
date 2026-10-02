import { Prisma } from '@prisma/client';
import { toNumber, toNumberOrNull } from '../common/utils/money';
import { telUrl, whatsappUrl } from '../common/utils/phone';
import { ORDER_TRANSITIONS } from './order-status';

export const orderDetailInclude = {
  items: { orderBy: { createdAt: 'asc' } },
  history: { orderBy: { createdAt: 'asc' } },
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
