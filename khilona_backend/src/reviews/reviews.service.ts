import { ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma, Review, ReviewStatus } from '@prisma/client';
import { AuthenticatedAdmin } from '../common/decorators/auth.decorators';
import { AuthenticatedCustomer } from '../common/decorators/customer-auth.decorators';
import { buildPage, skipTake } from '../common/utils/pagination';
import { displayName } from '../customer-auth/customer.mapper';
import { PrismaService } from '../database/prisma.service';
import { ItemReviewState, OrderDetailRow } from '../orders/order.mapper';
import { StoreService } from '../stores/store.service';
import { AdminReviewQueryDto, CreateReviewDto, PublicReviewQueryDto, UpdateReviewDto } from './dto/review.dto';

const toOwnReview = (r: Review) => ({
  id: r.id,
  rating: r.rating,
  comment: r.comment,
  status: r.status,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

/** Recomputes the denormalised rating columns on Product from APPROVED reviews. */
export async function recomputeProductRating(tx: Prisma.TransactionClient, productId: string) {
  const agg = await tx.review.aggregate({
    where: { productId, status: ReviewStatus.APPROVED },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await tx.product.update({
    where: { id: productId },
    data: { ratingAvg: Math.round((agg._avg.rating ?? 0) * 100) / 100, ratingCount: agg._count._all },
  });
}

/**
 * Verified-purchase reviews. Eligibility is decided here, never by the client:
 * signed-in customer → owns the order (linked to their account) → order contains the product →
 * order is DELIVERED → no review yet for that customer + product + order.
 */
@Injectable()
export class ReviewsService {
  private readonly logger = new Logger('Reviews');

  constructor(
    private readonly prisma: PrismaService,
    private readonly store: StoreService,
  ) {}

  // ─── Eligibility (used by the account order view) ─────────

  async reviewStateForOrder(customerId: string, order: OrderDetailRow): Promise<(productId: string | null) => ItemReviewState> {
    const productIds = [...new Set(order.items.map((i) => i.productId).filter((id): id is string => !!id))];
    const [reviews, products] = await Promise.all([
      this.prisma.review.findMany({ where: { orderId: order.id, customerId } }),
      this.prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true } }),
    ]);
    const byProduct = new Map(reviews.map((r) => [r.productId, r]));
    const existing = new Set(products.map((p) => p.id));
    const owned = order.customerId === customerId && order.accountLinkedAt !== null;
    const delivered = owned && order.status === OrderStatus.DELIVERED;

    return (productId) => {
      if (!productId) return { review: null, canReview: false };
      const review = byProduct.get(productId);
      return { review: review ? toOwnReview(review) : null, canReview: delivered && !review && existing.has(productId) };
    };
  }

  // ─── Customer ──────────────────────────────────────────────

  async create(customer: AuthenticatedCustomer, dto: CreateReviewDto) {
    const order = await this.prisma.order.findFirst({
      where: { orderNumber: dto.orderNumber, customerId: customer.id, accountLinkedAt: { not: null } },
      select: { id: true, status: true, items: { where: { productId: dto.productId }, select: { id: true }, take: 1 } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.items.length === 0) throw new ForbiddenException('You can only review products that are part of this order');
    if (order.status !== OrderStatus.DELIVERED) {
      throw new ForbiddenException('You can review this product once your order has been delivered');
    }
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId }, select: { id: true } });
    if (!product) throw new NotFoundException('This product is no longer available to review');

    const status = (await this.store.get()).reviewsRequireApproval ? ReviewStatus.PENDING : ReviewStatus.APPROVED;
    try {
      const review = await this.prisma.$transaction(async (tx) => {
        const created = await tx.review.create({
          data: {
            customerId: customer.id,
            productId: dto.productId,
            orderId: order.id,
            rating: dto.rating,
            comment: dto.comment ?? null,
            status,
          },
        });
        await recomputeProductRating(tx, dto.productId);
        return created;
      });
      this.logger.log(`Customer ${customer.id} reviewed product ${dto.productId} (${dto.rating}★, ${status})`);
      return toOwnReview(review);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('You have already reviewed this product for this order');
      }
      throw err;
    }
  }

  async update(customer: AuthenticatedCustomer, id: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findFirst({ where: { id, customerId: customer.id } });
    if (!review) throw new NotFoundException('Review not found');
    // An edited review goes back to moderation when the store requires approval; hidden stays hidden.
    const status =
      review.status === ReviewStatus.HIDDEN
        ? ReviewStatus.HIDDEN
        : (await this.store.get()).reviewsRequireApproval
          ? ReviewStatus.PENDING
          : ReviewStatus.APPROVED;
    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.review.update({
        where: { id },
        data: {
          ...(dto.rating !== undefined ? { rating: dto.rating } : {}),
          ...(dto.comment !== undefined ? { comment: dto.comment } : {}),
          status,
        },
      });
      await recomputeProductRating(tx, review.productId);
      return row;
    });
    return toOwnReview(updated);
  }

  async remove(customer: AuthenticatedCustomer, id: string) {
    const review = await this.prisma.review.findFirst({ where: { id, customerId: customer.id } });
    if (!review) throw new NotFoundException('Review not found');
    await this.prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id } });
      await recomputeProductRating(tx, review.productId);
    });
  }

  async mine(customer: AuthenticatedCustomer, page: number, limit: number) {
    const where: Prisma.ReviewWhereInput = { customerId: customer.id };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: {
          product: { select: { id: true, name: true, slug: true, thumbnailUrl: true, isActive: true, deletedAt: true } },
          order: { select: { orderNumber: true } },
        },
        ...skipTake(page, limit),
      }),
      this.prisma.review.count({ where }),
    ]);
    return buildPage(
      rows.map((r) => ({
        ...toOwnReview(r),
        orderNumber: r.order.orderNumber,
        product: {
          id: r.product.id,
          name: r.product.name,
          slug: r.product.isActive && !r.product.deletedAt ? r.product.slug : null,
          thumbnailUrl: r.product.thumbnailUrl,
        },
      })),
      total,
      page,
      limit,
    );
  }

  // ─── Public ────────────────────────────────────────────────

  async publicList(slug: string, query: PublicReviewQueryDto) {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true, deletedAt: null },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const base: Prisma.ReviewWhereInput = { productId: product.id, status: ReviewStatus.APPROVED };
    const where: Prisma.ReviewWhereInput = query.rating ? { ...base, rating: query.rating } : base;
    const [groups, rows, total] = await this.prisma.$transaction([
      this.prisma.review.groupBy({ by: ['rating'], where: base, _count: { _all: true }, orderBy: { rating: 'desc' } }),
      this.prisma.review.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: {
          customer: { select: { name: true } },
          order: { select: { items: { where: { productId: product.id }, select: { variantTitle: true }, take: 1 } } },
        },
        ...skipTake(query.page, query.limit),
      }),
      this.prisma.review.count({ where }),
    ]);

    const distribution: Record<'1' | '2' | '3' | '4' | '5', number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    let count = 0;
    let sum = 0;
    for (const g of groups) {
      const n = (g._count as { _all: number })._all;
      distribution[String(g.rating) as keyof typeof distribution] = n;
      count += n;
      sum += g.rating * n;
    }

    return {
      summary: { average: count ? Math.round((sum / count) * 10) / 10 : 0, count, distribution },
      ...buildPage(
        rows.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          authorName: displayName(r.customer.name),
          variantTitle: r.order.items[0]?.variantTitle ?? null,
          // Every review is tied to a delivered order of the reviewer (enforced on create).
          verifiedPurchase: true,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
        total,
        query.page,
        query.limit,
      ),
    };
  }

  // ─── Admin (moderation only — content and ratings are never editable) ──

  async adminList(query: AdminReviewQueryDto) {
    const and: Prisma.ReviewWhereInput[] = [];
    if (query.status) and.push({ status: query.status });
    if (query.rating) and.push({ rating: query.rating });
    if (query.search) {
      const s = query.search.trim();
      and.push({
        OR: [
          { product: { name: { contains: s, mode: 'insensitive' } } },
          { customer: { name: { contains: s, mode: 'insensitive' } } },
          { order: { orderNumber: { contains: s, mode: 'insensitive' } } },
          { comment: { contains: s, mode: 'insensitive' } },
        ],
      });
    }
    const where: Prisma.ReviewWhereInput = and.length ? { AND: and } : {};
    const [rows, total, counts] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: {
          product: { select: { id: true, name: true, slug: true, thumbnailUrl: true } },
          customer: { select: { id: true, name: true, phone: true } },
          order: { select: { id: true, orderNumber: true, status: true } },
        },
        ...skipTake(query.page, query.limit),
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.groupBy({ by: ['status'], _count: { _all: true }, orderBy: { status: 'asc' } }),
    ]);
    const statusCounts: Record<ReviewStatus | 'ALL', number> = { ALL: 0, PENDING: 0, APPROVED: 0, HIDDEN: 0 };
    for (const c of counts) {
      const n = (c._count as { _all: number })._all;
      statusCounts[c.status] = n;
      statusCounts.ALL += n;
    }
    return {
      ...buildPage(
        rows.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          status: r.status,
          verifiedPurchase: r.order.status === OrderStatus.DELIVERED,
          product: r.product,
          customer: { id: r.customer.id, name: r.customer.name, phone: r.customer.phone },
          order: { id: r.order.id, orderNumber: r.order.orderNumber },
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
        total,
        query.page,
        query.limit,
      ),
      statusCounts,
    };
  }

  async adminSetStatus(id: string, status: 'APPROVED' | 'HIDDEN', admin: AuthenticatedAdmin) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    await this.prisma.$transaction(async (tx) => {
      await tx.review.update({ where: { id }, data: { status } });
      await recomputeProductRating(tx, review.productId);
    });
    this.logger.log(`${admin.email} set review ${id} to ${status}`);
    return { id, status };
  }
}
