import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { FieldError } from '../common/filters/all-exceptions.filter';
import { roundMoney } from '../common/utils/money';
import { buildPage, skipTake } from '../common/utils/pagination';
import { addDaysIso, startOfDayInZone } from '../common/utils/time';
import { AuthenticatedAdmin } from '../common/decorators/auth.decorators';
import { AuthenticatedCustomer } from '../common/decorators/customer-auth.decorators';
import { APP_CONFIG, AppConfig } from '../config/configuration';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { recomputeProductAggregates } from '../products/pricing';
import { StoreService } from '../stores/store.service';
import { CartPricingService } from './cart-pricing.service';
import { AdminOrderQueryDto, CreateOrderDto, UpdateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import {
  OrderDetailRow,
  orderDetailInclude,
  orderListSelect,
  toAdminOrderDetail,
  toAdminOrderListItem,
  toPublicOrder,
} from './order.mapper';
import { OrderNumberService } from './order-number.service';
import { ORDER_STATUS_LABELS, ORDER_TRANSITIONS } from './order-status';

const ORDER_TX = { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 20_000, maxWait: 10_000 };

const ORDER_SORTS: Record<string, Prisma.OrderOrderByWithRelationInput[]> = {
  newest: [{ createdAt: 'desc' }],
  oldest: [{ createdAt: 'asc' }],
  total_desc: [{ total: 'desc' }],
  total_asc: [{ total: 'asc' }],
};

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger('Orders');

  constructor(
    private readonly prisma: PrismaService,
    private readonly cartPricing: CartPricingService,
    private readonly orderNumbers: OrderNumberService,
    private readonly store: StoreService,
    private readonly notifications: NotificationsService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  // ─── Customer ──────────────────────────────────────────────

  /**
   * Places an order atomically:
   * 1. re-prices every line from live data (client prices are never trusted);
   * 2. decrements stock with conditional updates (`stock >= qty`) so stock can never go negative,
   *    even under concurrent checkouts;
   * 3. allocates a collision-safe order number and stores immutable item snapshots.
   */
  async create(dto: CreateOrderDto, meta: RequestMeta, account?: AuthenticatedCustomer) {
    const store = await this.store.get();
    if (!store.isOpen) {
      throw new ForbiddenException(store.closedMessage || 'The store is not accepting orders right now. Please try again later.');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const evaluation = await this.cartPricing.evaluate(dto.items, tx);
      const problems: FieldError[] = evaluation.lines
        .filter((l) => l.status !== 'OK')
        .map((l) => ({
          field: `items.${l.index}`,
          message: `${l.product?.name ?? 'An item'}${l.variant ? ` (${l.variant.title})` : ''}: ${l.message}`,
        }));
      if (problems.length) {
        throw new ConflictException({ message: 'Some items in your cart need attention', errors: problems });
      }

      // Reserve stock.
      const touchedVariantProducts = new Set<string>();
      for (const line of evaluation.lines) {
        const updated = line.variantId
          ? await tx.productVariant.updateMany({
              where: { id: line.variantId, isActive: true, stock: { gte: line.quantity } },
              data: { stock: { decrement: line.quantity } },
            })
          : await tx.product.updateMany({
              where: { id: line.productId, stock: { gte: line.quantity } },
              data: { stock: { decrement: line.quantity } },
            });
        if (updated.count === 0) {
          throw new ConflictException({
            message: 'Some items in your cart need attention',
            errors: [{ field: `items.${line.index}`, message: `${line.product?.name ?? 'An item'}: stock just changed, please review your cart` }],
          });
        }
        if (line.variantId) touchedVariantProducts.add(line.productId);
      }
      for (const productId of touchedVariantProducts) await recomputeProductAggregates(tx, productId);

      const orderNumber = await this.orderNumbers.next(tx);

      // Signed-in checkout: the order belongs to the account (delivery details may differ, e.g. gifts).
      // Guest checkout: customers are matched by phone; a registered account's profile is never
      // overwritten by a guest checkout, and such orders do not appear in that account.
      const customerId = account
        ? account.id
        : (
            await tx.customer.upsert({
              where: { phone: dto.phone },
              create: { name: dto.customerName, phone: dto.phone, email: dto.email ?? null },
              update: {},
            })
          ).id;
      if (!account) {
        await tx.customer.updateMany({
          where: { id: customerId, passwordHash: null },
          data: { name: dto.customerName, ...(dto.email ? { email: dto.email } : {}) },
        });
      }

      const { summary } = evaluation;
      return tx.order.create({
        data: {
          orderNumber,
          customerId,
          accountLinkedAt: account ? new Date() : null,
          status: OrderStatus.PENDING,
          customerName: dto.customerName,
          customerPhone: dto.phone,
          alternatePhone: dto.alternatePhone ?? null,
          customerEmail: dto.email ?? null,
          address: dto.address,
          city: dto.city,
          state: dto.state,
          pincode: dto.pincode,
          landmark: dto.landmark ?? null,
          googleMapsLink: dto.googleMapsLink ?? null,
          locationLink: dto.locationLink ?? null,
          latitude: dto.latitude ?? null,
          longitude: dto.longitude ?? null,
          customerNote: dto.note ?? null,
          itemsCount: summary.itemsCount,
          subtotal: summary.subtotal,
          discount: summary.discount,
          shippingFee: summary.shippingFee,
          total: summary.total,
          ipAddress: meta.ip?.slice(0, 64) ?? null,
          userAgent: meta.userAgent?.slice(0, 255) ?? null,
          items: {
            create: evaluation.lines.map((line) => {
              const product = line._product!;
              const variant = line._variant;
              return {
                productId: product.id,
                variantId: variant?.id ?? null,
                productName: product.name,
                productSlug: product.slug,
                sku: variant?.sku ?? product.sku,
                variantTitle: variant?.title ?? null,
                options: line.variant
                  ? Object.entries(line.variant.options).map(([name, value]) => ({ name, value }))
                  : Prisma.JsonNull,
                imageUrl: variant?.imageUrl ?? product.thumbnailUrl,
                categoryName: product.category.name,
                unitMrp: line.unitMrp,
                unitPrice: line.unitPrice,
                quantity: line.quantity,
                lineTotal: roundMoney(line.unitPrice * line.quantity),
              };
            }),
          },
          history: { create: { fromStatus: null, toStatus: OrderStatus.PENDING, note: 'Order placed by customer' } },
        },
        include: orderDetailInclude,
      });
    }, ORDER_TX);

    this.notifications.orderPlaced(this.event(order));
    return { ...toPublicOrder(order), linkedToAccount: order.accountLinkedAt !== null };
  }

  async track(orderNumber: string, phone: string) {
    return toPublicOrder(await this.findForGuest(orderNumber, phone));
  }

  /** Guest access: the order is only revealed when order number AND mobile number match. */
  async findForGuest(orderNumber: string, phone: string) {
    const order = await this.prisma.order.findFirst({
      where: { orderNumber, customerPhone: phone },
      include: orderDetailInclude,
    });
    if (!order) throw new NotFoundException('We could not find an order with these details');
    return order;
  }

  /**
   * Account access: only orders linked to this customer's account. Anything else — including
   * another customer's order — is reported as "not found" so order numbers cannot be probed.
   */
  async findOwned(customerId: string, orderNumber: string) {
    const order = await this.prisma.order.findFirst({
      where: { orderNumber: orderNumber.trim().toUpperCase(), customerId, accountLinkedAt: { not: null } },
      include: orderDetailInclude,
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  /** Customers may cancel their own order only while it is still PENDING (not yet confirmed by the store). */
  async cancelByCustomer(customer: AuthenticatedCustomer, orderNumber: string, reason?: string) {
    const order = await this.findOwned(customer.id, orderNumber);
    if (order.status !== OrderStatus.PENDING) {
      throw new ConflictException(
        order.status === OrderStatus.CANCELLED
          ? 'This order is already cancelled'
          : 'This order has already been confirmed by the store. Please contact the store to cancel it.',
      );
    }
    await this.transition(order, OrderStatus.CANCELLED, {
      id: null,
      name: 'Customer',
      note: reason ? `Cancelled by customer: ${reason}` : 'Cancelled by customer',
    });
    this.logger.log(`Customer ${customer.id} cancelled ${order.orderNumber}`);
    const fresh = await this.findOwned(customer.id, order.orderNumber);
    this.notifications.orderStatusChanged({ ...this.event(fresh), from: order.status, to: OrderStatus.CANCELLED });
    return fresh;
  }

  // ─── Admin ─────────────────────────────────────────────────

  async adminList(query: AdminOrderQueryDto) {
    const where = this.adminWhere(query);
    const orderBy = [...(ORDER_SORTS[query.sort ?? 'newest'] ?? ORDER_SORTS.newest), { id: 'desc' as const }];
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({ where, orderBy, select: orderListSelect, ...skipTake(query.page, query.limit) }),
      this.prisma.order.count({ where }),
    ]);
    return buildPage(rows.map(toAdminOrderListItem), total, query.page, query.limit);
  }

  async statusCounts() {
    const groups = await this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } });
    const counts = Object.fromEntries(Object.values(OrderStatus).map((s) => [s, 0])) as Record<OrderStatus | 'ALL', number>;
    counts.ALL = 0;
    for (const g of groups) {
      counts[g.status] = g._count._all;
      counts.ALL += g._count._all;
    }
    return counts;
  }

  async adminGet(idOrNumber: string) {
    const order = await this.findOrder(idOrNumber);
    return this.toDetail(order);
  }

  async updateStatus(idOrNumber: string, dto: UpdateOrderStatusDto, admin: AuthenticatedAdmin) {
    const order = await this.findOrder(idOrNumber);
    const from = order.status;
    const to = dto.status;

    if (from === to) {
      throw new ConflictException(`Order is already ${ORDER_STATUS_LABELS[to].toLowerCase()}`);
    }
    if (!ORDER_TRANSITIONS[from].includes(to)) {
      const allowed = ORDER_TRANSITIONS[from].map((s) => ORDER_STATUS_LABELS[s]).join(', ');
      throw new ConflictException(
        `Cannot change status from ${ORDER_STATUS_LABELS[from]} to ${ORDER_STATUS_LABELS[to]}.` +
          (allowed ? ` Allowed: ${allowed}.` : ' This order is closed.'),
      );
    }

    await this.transition(order, to, { id: admin.id, name: admin.name, note: dto.note });

    this.logger.log(`${admin.email} changed ${order.orderNumber}: ${from} → ${to}`);
    const fresh = await this.findOrder(order.id);
    this.notifications.orderStatusChanged({ ...this.event(fresh), from, to });
    return this.toDetail(fresh);
  }

  async update(idOrNumber: string, dto: UpdateOrderDto, admin: AuthenticatedAdmin) {
    const order = await this.findOrder(idOrNumber);
    await this.prisma.order.update({
      where: { id: order.id },
      data: { adminNote: dto.adminNote, paymentStatus: dto.paymentStatus },
    });
    this.logger.log(`${admin.email} updated ${order.orderNumber} (${Object.keys(dto).join(', ')})`);
    return this.adminGet(order.id);
  }

  // ─── Helpers ───────────────────────────────────────────────

  /**
   * Applies an already-validated status change atomically: optimistic concurrency on the current
   * status, timestamps, exactly-once stock restoration on cancel, and a history entry.
   */
  private async transition(
    order: { id: string; status: OrderStatus; confirmedAt: Date | null; stockRestored: boolean; items: OrderDetailRow['items'] },
    to: OrderStatus,
    actor: { id: string | null; name: string; note?: string },
  ) {
    const from = order.status;
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      // Optimistic concurrency: only succeeds if nobody changed the status meanwhile.
      const updated = await tx.order.updateMany({
        where: { id: order.id, status: from },
        data: {
          status: to,
          ...(to === 'CONFIRMED' && !order.confirmedAt ? { confirmedAt: now } : {}),
          ...(to === 'DELIVERED' ? { deliveredAt: now } : {}),
          ...(to === 'CANCELLED' ? { cancelledAt: now } : {}),
        },
      });
      if (updated.count === 0) {
        throw new ConflictException('This order was just updated by someone else. Refresh and try again.');
      }

      if (to === 'CANCELLED' && !order.stockRestored) {
        await this.restoreStock(tx, order.id, order.items);
        await tx.order.update({ where: { id: order.id }, data: { stockRestored: true } });
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: from,
          toStatus: to,
          note: actor.note ?? null,
          changedById: actor.id,
          changedByName: actor.name,
        },
      });
    }, ORDER_TX);
  }

  /**
   * Stock restoration policy (on cancellation): every item's quantity is returned to the
   * variant (or simple product) it was taken from — exactly once per order. Items whose
   * product/variant has since been deleted cannot be restored and are logged.
   */
  private async restoreStock(
    tx: Prisma.TransactionClient,
    orderId: string,
    items: { productId: string | null; variantId: string | null; quantity: number; productName: string }[],
  ) {
    const touched = new Set<string>();
    for (const item of items) {
      if (item.variantId) {
        const res = await tx.productVariant.updateMany({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
        if (res.count && item.productId) touched.add(item.productId);
        if (!res.count) this.logger.warn(`Order ${orderId}: variant for "${item.productName}" no longer exists; stock not restored`);
      } else if (item.productId) {
        const res = await tx.product.updateMany({
          where: { id: item.productId, hasVariants: false },
          data: { stock: { increment: item.quantity } },
        });
        if (!res.count) this.logger.warn(`Order ${orderId}: "${item.productName}" could not be restocked (product changed)`);
      }
    }
    for (const productId of touched) await recomputeProductAggregates(tx, productId);
  }

  private adminWhere(query: AdminOrderQueryDto): Prisma.OrderWhereInput {
    const and: Prisma.OrderWhereInput[] = [];
    if (query.status) and.push({ status: query.status });
    if (query.search) {
      const s = query.search.trim();
      const digits = s.replace(/\D/g, '');
      and.push({
        OR: [
          { orderNumber: { contains: s, mode: 'insensitive' } },
          { customerName: { contains: s, mode: 'insensitive' } },
          { customerEmail: { contains: s, mode: 'insensitive' } },
          ...(digits.length >= 3 ? [{ customerPhone: { contains: digits.slice(-10) } }] : []),
        ],
      });
    }
    if (query.from) and.push({ createdAt: { gte: startOfDayInZone(query.from, this.config.timezone) } });
    if (query.to) and.push({ createdAt: { lt: startOfDayInZone(addDaysIso(query.to, 1), this.config.timezone) } });
    return and.length ? { AND: and } : {};
  }

  private async findOrder(idOrNumber: string) {
    const order = await this.prisma.order.findFirst({
      where: { OR: [{ id: idOrNumber }, { orderNumber: idOrNumber.toUpperCase() }] },
      include: orderDetailInclude,
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  private async toDetail(order: Awaited<ReturnType<OrdersService['findOrder']>>) {
    const [store, customerOrdersCount] = await Promise.all([
      this.store.get(),
      this.prisma.order.count({ where: { customerPhone: order.customerPhone } }),
    ]);
    return toAdminOrderDetail(order, store.name, customerOrdersCount);
  }

  private event(order: { id: string; orderNumber: string; customerName: string; customerPhone: string; total: Prisma.Decimal; itemsCount: number }) {
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      total: Number(order.total),
      itemsCount: order.itemsCount,
    };
  }
}
