import { Inject, Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { toNumber } from '../common/utils/money';
import { addDaysIso, isoDateInZone, startOfDayInZone } from '../common/utils/time';
import { APP_CONFIG, AppConfig } from '../config/configuration';
import { PrismaService } from '../database/prisma.service';
import { orderListSelect, toAdminOrderListItem } from '../orders/order.mapper';

/** Real, query-derived numbers only — no placeholder analytics. */
@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async overview() {
    const tz = this.config.timezone;
    const todayIso = isoDateInZone(new Date(), tz);
    const todayStart = startOfDayInZone(todayIso, tz);
    const chartStartIso = addDaysIso(todayIso, -13);
    const chartStart = startOfDayInZone(chartStartIso, tz);
    const liveProduct = { deletedAt: null };
    const lowStockWhere = {
      ...liveProduct,
      stock: { gt: 0, lte: this.prisma.product.fields.lowStockThreshold },
    };

    const [
      statusGroups,
      today,
      delivered,
      open,
      productsTotal,
      productsActive,
      productsOut,
      productsLow,
      productsFeatured,
      categoriesTotal,
      categoriesActive,
      recent,
      lowStock,
      daily,
    ] = await Promise.all([
      this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.order.aggregate({ where: { status: 'DELIVERED' }, _sum: { total: true } }),
      this.prisma.order.aggregate({ where: { status: { notIn: ['DELIVERED', 'CANCELLED'] } }, _sum: { total: true } }),
      this.prisma.product.count({ where: liveProduct }),
      this.prisma.product.count({ where: { ...liveProduct, isActive: true } }),
      this.prisma.product.count({ where: { ...liveProduct, stock: { lte: 0 } } }),
      this.prisma.product.count({ where: lowStockWhere }),
      this.prisma.product.count({ where: { ...liveProduct, isFeatured: true } }),
      this.prisma.category.count(),
      this.prisma.category.count({ where: { isActive: true } }),
      this.prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 6, select: orderListSelect }),
      this.prisma.product.findMany({
        where: { ...liveProduct, stock: { lte: this.prisma.product.fields.lowStockThreshold } },
        orderBy: [{ stock: 'asc' }, { name: 'asc' }],
        take: 6,
        select: { id: true, name: true, sku: true, stock: true, thumbnailUrl: true, lowStockThreshold: true },
      }),
      this.prisma.$queryRaw<{ day: string; count: bigint; total: unknown }[]>`
        SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz}, 'YYYY-MM-DD') AS day,
               COUNT(*) AS count,
               COALESCE(SUM("total"), 0) AS total
        FROM "Order"
        WHERE "createdAt" >= ${chartStart} AND "status" <> 'CANCELLED'
        GROUP BY 1`,
    ]);

    const byStatus = Object.fromEntries(Object.values(OrderStatus).map((s) => [s, 0])) as Record<OrderStatus, number>;
    let totalOrders = 0;
    for (const g of statusGroups) {
      byStatus[g.status] = g._count._all;
      totalOrders += g._count._all;
    }

    const dailyMap = new Map(daily.map((d) => [d.day, d]));
    const ordersLast14Days = Array.from({ length: 14 }, (_, i) => {
      const date = addDaysIso(chartStartIso, i);
      const row = dailyMap.get(date);
      return { date, count: row ? Number(row.count) : 0, total: row ? toNumber(String(row.total)) : 0 };
    });

    return {
      orders: {
        total: totalOrders,
        today,
        byStatus,
        deliveredRevenue: toNumber(delivered._sum.total),
        openValue: toNumber(open._sum.total),
      },
      products: {
        total: productsTotal,
        active: productsActive,
        inactive: productsTotal - productsActive,
        outOfStock: productsOut,
        lowStock: productsLow,
        featured: productsFeatured,
      },
      categories: { total: categoriesTotal, active: categoriesActive },
      recentOrders: recent.map(toAdminOrderListItem),
      lowStockProducts: lowStock,
      ordersLast14Days,
    };
  }
}
