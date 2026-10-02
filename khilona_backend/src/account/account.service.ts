import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { AuthenticatedCustomer } from '../common/decorators/customer-auth.decorators';
import { FieldError } from '../common/filters/all-exceptions.filter';
import { buildPage, skipTake } from '../common/utils/pagination';
import { toCustomerProfile } from '../customer-auth/customer.mapper';
import { UpdateCustomerProfileDto } from '../customer-auth/dto/customer-auth.dto';
import { PrismaService } from '../database/prisma.service';
import { DocumentKind, DocumentsService } from '../documents/documents.service';
import { customerOrderListSelect, toCustomerOrderDetail, toCustomerOrderListItem } from '../orders/order.mapper';
import { OrdersService } from '../orders/orders.service';
import { ReviewsService } from '../reviews/reviews.service';
import { StoreService } from '../stores/store.service';
import { CustomerOrderQueryDto } from './dto/account.dto';

const ACTIVE_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY', 'OUT_FOR_DELIVERY'];

@Injectable()
export class AccountService {
  private readonly logger = new Logger('Account');

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
    private readonly reviews: ReviewsService,
    private readonly documents: DocumentsService,
    private readonly store: StoreService,
  ) {}

  /** Orders visible in an account: linked to it (placed while signed in, or claimed). */
  private ownedWhere(customerId: string): Prisma.OrderWhereInput {
    return { customerId, accountLinkedAt: { not: null } };
  }

  async profile(customerId: string) {
    return toCustomerProfile(await this.prisma.customer.findUniqueOrThrow({ where: { id: customerId } }));
  }

  /**
   * Updates name / email / mobile. A new mobile that belongs to a guest-only record (earlier
   * guest checkouts) is merged into this account — its orders stay private until claimed.
   */
  async updateProfile(customerId: string, dto: UpdateCustomerProfileDto) {
    const me = await this.prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
    const errors: FieldError[] = [];

    if (dto.email && dto.email !== me.accountEmail) {
      const taken = await this.prisma.customer.findUnique({ where: { accountEmail: dto.email }, select: { id: true } });
      if (taken && taken.id !== me.id) errors.push({ field: 'email', message: 'This email is already used by another account' });
    }
    let guestRecordId: string | null = null;
    if (dto.phone && dto.phone !== me.phone) {
      const other = await this.prisma.customer.findUnique({ where: { phone: dto.phone }, select: { id: true, passwordHash: true } });
      if (other?.passwordHash) errors.push({ field: 'phone', message: 'This mobile number is linked to another account' });
      else if (other) guestRecordId = other.id;
    }
    if (errors.length) throw new ConflictException({ message: errors[0].message, errors });

    const updated = await this.prisma.$transaction(async (tx) => {
      if (guestRecordId) {
        await tx.order.updateMany({ where: { customerId: guestRecordId }, data: { customerId: me.id } });
        await tx.customer.delete({ where: { id: guestRecordId } });
      }
      return tx.customer.update({
        where: { id: me.id },
        data: {
          ...(dto.name ? { name: dto.name } : {}),
          ...(dto.email ? { email: dto.email, accountEmail: dto.email } : {}),
          ...(dto.phone ? { phone: dto.phone } : {}),
        },
      });
    });
    return toCustomerProfile(updated);
  }

  async orderSummary(customerId: string) {
    const where = this.ownedWhere(customerId);
    const [groups, recent] = await this.prisma.$transaction([
      this.prisma.order.groupBy({ by: ['status'], where, _count: { _all: true }, orderBy: { status: 'asc' } }),
      this.prisma.order.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 3, select: customerOrderListSelect }),
    ]);
    const count = (statuses: OrderStatus[]) =>
      groups.filter((g) => statuses.includes(g.status)).reduce((sum, g) => sum + (g._count as { _all: number })._all, 0);
    return {
      totalOrders: count(Object.values(OrderStatus)),
      activeOrders: count(ACTIVE_STATUSES),
      deliveredOrders: count(['DELIVERED']),
      cancelledOrders: count(['CANCELLED']),
      recentOrders: recent.map(toCustomerOrderListItem),
    };
  }

  async listOrders(customerId: string, query: CustomerOrderQueryDto) {
    const status =
      query.status === 'active' ? { in: ACTIVE_STATUSES } : query.status === 'delivered' ? OrderStatus.DELIVERED : query.status === 'cancelled' ? OrderStatus.CANCELLED : undefined;
    const where: Prisma.OrderWhereInput = { ...this.ownedWhere(customerId), ...(status ? { status } : {}) };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: customerOrderListSelect,
        ...skipTake(query.page, query.limit),
      }),
      this.prisma.order.count({ where }),
    ]);
    return buildPage(rows.map(toCustomerOrderListItem), total, query.page, query.limit);
  }

  async orderDetail(customerId: string, orderNumber: string) {
    const order = await this.orders.findOwned(customerId, orderNumber);
    return toCustomerOrderDetail(order, await this.reviews.reviewStateForOrder(customerId, order));
  }

  async cancelOrder(customer: AuthenticatedCustomer, orderNumber: string, reason?: string) {
    const order = await this.orders.cancelByCustomer(customer, orderNumber, reason);
    return toCustomerOrderDetail(order, await this.reviews.reviewStateForOrder(customer.id, order));
  }

  /**
   * Adds an earlier guest order to the account. Requires the order number AND that the order was
   * placed with the account's mobile number — the same proof guest tracking already requires — so
   * linking never reveals anything the customer could not already see.
   */
  async claimOrder(customer: AuthenticatedCustomer, orderNumber: string) {
    const order = await this.prisma.order.findFirst({
      where: { orderNumber, customerPhone: customer.phone },
      select: { id: true, orderNumber: true, customerId: true, accountLinkedAt: true },
    });
    if (!order) throw new NotFoundException('We could not find an order with this number for your mobile number');
    if (order.accountLinkedAt) {
      if (order.customerId === customer.id) throw new ConflictException('This order is already in your account');
      throw new NotFoundException('We could not find an order with this number for your mobile number');
    }
    await this.prisma.order.update({ where: { id: order.id }, data: { customerId: customer.id, accountLinkedAt: new Date() } });
    this.logger.log(`Customer ${customer.id} added guest order ${order.orderNumber} to their account`);
    return this.orderDetail(customer.id, order.orderNumber);
  }

  async document(customerId: string, orderNumber: string, kind: DocumentKind) {
    const order = await this.orders.findOwned(customerId, orderNumber);
    return this.renderDocument(order, kind);
  }

  async guestDocument(orderNumber: string, phone: string, kind: DocumentKind) {
    return this.renderDocument(await this.orders.findForGuest(orderNumber, phone), kind);
  }

  private async renderDocument(order: Awaited<ReturnType<OrdersService['findOwned']>>, kind: DocumentKind) {
    if (kind === 'invoice' && order.status === OrderStatus.CANCELLED) {
      throw new ConflictException('An invoice is not available for a cancelled order. You can still download the order receipt.');
    }
    return this.documents.generate(kind, order, await this.store.get());
  }
}
