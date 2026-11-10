import { ConflictException, Inject, Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ExchangeStatus, OrderStatus, Prisma } from '@prisma/client';
import { AuthenticatedAdmin } from '../common/decorators/auth.decorators';
import { AuthenticatedCustomer } from '../common/decorators/customer-auth.decorators';
import { toNumber } from '../common/utils/money';
import { buildPage, skipTake } from '../common/utils/pagination';
import { telUrl, whatsappUrl } from '../common/utils/phone';
import { compactDateInZone } from '../common/utils/time';
import { APP_CONFIG, AppConfig } from '../config/configuration';
import { PrismaService } from '../database/prisma.service';
import { OrderDetailRow, OrderExchangeState } from '../orders/order.mapper';
import { OrdersService } from '../orders/orders.service';
import { StoreService } from '../stores/store.service';
import { AdminExchangeQueryDto, CreateExchangeDto, UpdateExchangeDto } from './dto/exchange.dto';
import { EXCHANGE_STATUS_LABELS, EXCHANGE_TRANSITIONS } from './exchange-status';

const DAY_MS = 24 * 60 * 60 * 1000;

const adminInclude = {
  order: { select: { id: true, orderNumber: true, customerName: true, customerPhone: true, deliveredAt: true, city: true } },
  orderItem: {
    select: { productName: true, productSlug: true, variantTitle: true, imageUrl: true, quantity: true, unitPrice: true, sku: true },
  },
} satisfies Prisma.ExchangeRequestInclude;

type AdminExchangeRow = Prisma.ExchangeRequestGetPayload<{ include: typeof adminInclude }>;

@Injectable()
export class ExchangesService {
  private readonly logger = new Logger('Exchanges');

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
    private readonly store: StoreService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  // ─── Eligibility ───────────────────────────────────────────

  /**
   * Exchange rules: the order must be DELIVERED, the request must arrive within the store's
   * exchange window (days after delivery), and every purchased item can be exchanged only once.
   */
  async stateForOrder(order: Pick<OrderDetailRow, 'status' | 'deliveredAt' | 'exchanges' | 'items'>): Promise<OrderExchangeState> {
    const { exchangeWindowDays } = await this.store.get();
    const deadline = order.status === OrderStatus.DELIVERED && order.deliveredAt ? new Date(order.deliveredAt.getTime() + exchangeWindowDays * DAY_MS) : null;
    const open = !!deadline && Date.now() <= deadline.getTime();
    const used = new Set(order.exchanges.map((e) => e.orderItemId));
    return {
      exchangeDeadline: deadline,
      exchangeWindowDays,
      canExchange: (itemId) => open && !used.has(itemId) && order.items.some((i) => i.id === itemId),
    };
  }

  // ─── Customer ──────────────────────────────────────────────

  async create(customer: AuthenticatedCustomer, orderNumber: string, dto: CreateExchangeDto) {
    const order = await this.orders.findOwned(customer.id, orderNumber);
    const item = order.items.find((i) => i.id === dto.orderItemId);
    if (!item) throw new NotFoundException('This product is not part of the order');

    if (order.status !== OrderStatus.DELIVERED) {
      throw new ConflictException('Exchanges can be requested once your order has been delivered');
    }
    if (order.exchanges.some((e) => e.orderItemId === item.id)) {
      throw new ConflictException('An exchange was already requested for this product. Each product can be exchanged only once.');
    }
    const state = await this.stateForOrder(order);
    if (!state.canExchange(item.id)) {
      throw new ConflictException(
        `The exchange window for this order has closed (${state.exchangeWindowDays} days after delivery). Please contact the store for help.`,
      );
    }
    const quantity = dto.quantity ?? item.quantity;
    if (quantity > item.quantity) {
      throw new UnprocessableEntityException({
        message: `You bought ${item.quantity} of this product`,
        errors: [{ field: 'quantity', message: `You can exchange at most ${item.quantity}` }],
      });
    }

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const requestNumber = await this.nextNumber(tx);
        return tx.exchangeRequest.create({
          data: {
            requestNumber,
            orderId: order.id,
            orderItemId: item.id,
            customerId: customer.id,
            reason: dto.reason,
            details: dto.details,
            quantity,
            contactPhone: order.customerPhone,
          },
        });
      });
      this.logger.log(`Customer ${customer.id} requested exchange ${created.requestNumber} for ${order.orderNumber} (${item.productName})`);
    } catch (e) {
      // unique(orderItemId): a concurrent double-submit
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('An exchange was already requested for this product. Each product can be exchanged only once.');
      }
      throw e;
    }
    return this.orders.findOwned(customer.id, order.orderNumber);
  }

  async listForCustomer(customerId: string) {
    const rows = await this.prisma.exchangeRequest.findMany({
      where: { customerId, order: { accountLinkedAt: { not: null }, customerId } },
      orderBy: { createdAt: 'desc' },
      include: adminInclude,
      take: 50,
    });
    return rows.map((r) => ({
      id: r.id,
      requestNumber: r.requestNumber,
      orderNumber: r.order.orderNumber,
      productName: r.orderItem.productName,
      imageUrl: r.orderItem.imageUrl,
      variantTitle: r.orderItem.variantTitle,
      reason: r.reason,
      details: r.details,
      quantity: r.quantity,
      status: r.status,
      adminNote: r.adminNote,
      resolvedAt: r.resolvedAt,
      createdAt: r.createdAt,
    }));
  }

  // ─── Admin ─────────────────────────────────────────────────

  async adminList(query: AdminExchangeQueryDto) {
    const and: Prisma.ExchangeRequestWhereInput[] = [];
    if (query.status) and.push({ status: query.status });
    if (query.search) {
      const s = query.search.trim();
      const digits = s.replace(/\D/g, '');
      and.push({
        OR: [
          { requestNumber: { contains: s, mode: 'insensitive' } },
          { order: { orderNumber: { contains: s, mode: 'insensitive' } } },
          { order: { customerName: { contains: s, mode: 'insensitive' } } },
          { orderItem: { productName: { contains: s, mode: 'insensitive' } } },
          ...(digits.length >= 3 ? [{ contactPhone: { contains: digits.slice(-10) } }] : []),
        ],
      });
    }
    const where: Prisma.ExchangeRequestWhereInput = and.length ? { AND: and } : {};
    const orderBy: Prisma.ExchangeRequestOrderByWithRelationInput[] = [{ createdAt: query.sort === 'oldest' ? 'asc' : 'desc' }, { id: 'desc' }];
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.exchangeRequest.findMany({ where, orderBy, include: adminInclude, ...skipTake(query.page, query.limit) }),
      this.prisma.exchangeRequest.count({ where }),
    ]);
    return buildPage(rows.map((r) => this.toAdmin(r)), total, query.page, query.limit);
  }

  async statusCounts() {
    const groups = await this.prisma.exchangeRequest.groupBy({ by: ['status'], _count: { _all: true } });
    const counts = Object.fromEntries(Object.values(ExchangeStatus).map((s) => [s, 0])) as Record<ExchangeStatus | 'ALL', number>;
    counts.ALL = 0;
    for (const g of groups) {
      counts[g.status] = g._count._all;
      counts.ALL += g._count._all;
    }
    return counts;
  }

  async adminGet(id: string) {
    const row = await this.prisma.exchangeRequest.findFirst({ where: { OR: [{ id }, { requestNumber: id.toUpperCase() }] }, include: adminInclude });
    if (!row) throw new NotFoundException('Exchange request not found');
    return this.toAdmin(row);
  }

  async adminUpdate(id: string, dto: UpdateExchangeDto, admin: AuthenticatedAdmin) {
    const row = await this.prisma.exchangeRequest.findFirst({ where: { OR: [{ id }, { requestNumber: id.toUpperCase() }] } });
    if (!row) throw new NotFoundException('Exchange request not found');

    const data: Prisma.ExchangeRequestUpdateInput = {};
    if (dto.adminNote !== undefined) data.adminNote = dto.adminNote;
    if (dto.status && dto.status !== row.status) {
      if (!EXCHANGE_TRANSITIONS[row.status].includes(dto.status)) {
        const allowed = EXCHANGE_TRANSITIONS[row.status].map((s) => EXCHANGE_STATUS_LABELS[s]).join(', ');
        throw new ConflictException(
          `Cannot change an exchange from ${EXCHANGE_STATUS_LABELS[row.status]} to ${EXCHANGE_STATUS_LABELS[dto.status]}.` +
            (allowed ? ` Allowed: ${allowed}.` : ' This request is closed.'),
        );
      }
      const note = dto.adminNote ?? row.adminNote;
      if (dto.status === ExchangeStatus.REJECTED && !note?.trim()) {
        throw new UnprocessableEntityException({
          message: 'Add a note explaining why the exchange is rejected',
          errors: [{ field: 'adminNote', message: 'Explain why the exchange is rejected (shown to the customer)' }],
        });
      }
      data.status = dto.status;
      data.handledByName = admin.name;
      if (dto.status === ExchangeStatus.REJECTED || dto.status === ExchangeStatus.COMPLETED) data.resolvedAt = new Date();
    }

    const updated = await this.prisma.exchangeRequest.updateMany({ where: { id: row.id, status: row.status }, data: data as Prisma.ExchangeRequestUpdateManyMutationInput });
    if (updated.count === 0) throw new ConflictException('This request was just updated by someone else. Refresh and try again.');
    this.logger.log(`${admin.email} updated exchange ${row.requestNumber}${dto.status ? `: ${row.status} → ${dto.status}` : ''}`);
    return this.adminGet(row.id);
  }

  // ─── Helpers ───────────────────────────────────────────────

  private toAdmin(r: AdminExchangeRow) {
    const greeting = `Hi ${r.order.customerName.split(' ')[0]}, this is regarding your exchange request ${r.requestNumber} (order ${r.order.orderNumber}).`;
    return {
      id: r.id,
      requestNumber: r.requestNumber,
      status: r.status,
      reason: r.reason,
      details: r.details,
      quantity: r.quantity,
      adminNote: r.adminNote,
      handledByName: r.handledByName,
      resolvedAt: r.resolvedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      allowedTransitions: EXCHANGE_TRANSITIONS[r.status],
      order: { id: r.order.id, orderNumber: r.order.orderNumber, deliveredAt: r.order.deliveredAt, city: r.order.city },
      customer: {
        name: r.order.customerName,
        phone: r.contactPhone,
        callUrl: telUrl(r.contactPhone),
        whatsappUrl: whatsappUrl(r.contactPhone, greeting),
      },
      item: {
        productName: r.orderItem.productName,
        productSlug: r.orderItem.productSlug,
        variantTitle: r.orderItem.variantTitle,
        imageUrl: r.orderItem.imageUrl,
        sku: r.orderItem.sku,
        quantity: r.orderItem.quantity,
        unitPrice: toNumber(r.orderItem.unitPrice),
      },
    };
  }

  /** EX-YYYYMMDD-NNNN, collision-safe via the shared per-day counter table. */
  private async nextNumber(tx: Prisma.TransactionClient) {
    const day = compactDateInZone(new Date(), this.config.timezone);
    const key = `EX-${day}`;
    const rows = await tx.$queryRaw<{ value: number }[]>`
      INSERT INTO "OrderCounter" ("day", "value") VALUES (${key}, 1)
      ON CONFLICT ("day") DO UPDATE SET "value" = "OrderCounter"."value" + 1
      RETURNING "value"`;
    return `EX-${day}-${String(Number(rows[0].value)).padStart(4, '0')}`;
  }
}
