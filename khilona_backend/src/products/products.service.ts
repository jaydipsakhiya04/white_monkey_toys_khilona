import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CategoriesService } from '../categories/categories.service';
import { toNumber } from '../common/utils/money';
import { buildPage, skipTake } from '../common/utils/pagination';
import { PrismaService } from '../database/prisma.service';
import { FacetsQueryDto, PublicProductQueryDto, PublicSort } from './dto/product.dto';
import { cardSelect, detailInclude, toProductCard, toProductDetail } from './product.mapper';

/** Products that may appear on the storefront: active, not archived, in an active category tree. */
export const STOREFRONT_PRODUCT: Prisma.ProductWhereInput = {
  isActive: true,
  deletedAt: null,
  category: { isActive: true, OR: [{ parentId: null }, { parent: { isActive: true } }] },
};

const SORTS: Record<PublicSort, Prisma.ProductOrderByWithRelationInput[]> = {
  featured: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
  newest: [{ createdAt: 'desc' }],
  price_asc: [{ minPrice: 'asc' }],
  price_desc: [{ maxPrice: 'desc' }],
  name_asc: [{ name: 'asc' }],
  name_desc: [{ name: 'desc' }],
};

/** Every whitespace-separated term must match one of the searchable fields. */
export function buildSearchWhere(search: string | undefined): Prisma.ProductWhereInput | null {
  const terms = (search ?? '').split(/\s+/).map((t) => t.trim()).filter(Boolean).slice(0, 6);
  if (!terms.length) return null;
  return {
    AND: terms.map((term) => ({
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { sku: { contains: term, mode: 'insensitive' } },
        { shortDescription: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { category: { name: { contains: term, mode: 'insensitive' } } },
        { variants: { some: { sku: { contains: term, mode: 'insensitive' } } } },
      ],
    })),
  };
}

/** "Color:Red,Color:Blue,Age:3+" → { Color: ["Red","Blue"], Age: ["3+"] } */
export function parseOptionFilter(raw: string | undefined): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const part of (raw ?? '').split(',')) {
    const idx = part.indexOf(':');
    if (idx <= 0) continue;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!name || !value) continue;
    const values = (groups[name] ??= []);
    if (!values.includes(value)) values.push(value);
  }
  return groups;
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categories: CategoriesService,
  ) {}

  private async baseWhere(categorySlug?: string, search?: string): Promise<Prisma.ProductWhereInput | null> {
    const and: Prisma.ProductWhereInput[] = [STOREFRONT_PRODUCT];
    if (categorySlug) {
      const ids = await this.categories.activeCategoryIdsBySlug(categorySlug);
      if (!ids) return null;
      and.push({ categoryId: { in: ids } });
    }
    const searchWhere = buildSearchWhere(search);
    if (searchWhere) and.push(searchWhere);
    return { AND: and };
  }

  async list(query: PublicProductQueryDto) {
    const base = await this.baseWhere(query.category, query.search);
    if (!base) throw new NotFoundException('Category not found');

    const and: Prisma.ProductWhereInput[] = [base];
    if (query.inStock) and.push({ stock: { gt: 0 } });
    if (query.featured) and.push({ isFeatured: true });
    // Price filter on effective price range (overlap with [min, max]).
    if (query.minPrice !== undefined) and.push({ maxPrice: { gte: query.minPrice } });
    if (query.maxPrice !== undefined) and.push({ minPrice: { lte: query.maxPrice } });

    for (const [name, values] of Object.entries(parseOptionFilter(query.options))) {
      and.push({
        variants: {
          some: {
            isActive: true,
            optionValues: { some: { optionValue: { value: { in: values }, option: { name } } } },
          },
        },
      });
    }

    const where: Prisma.ProductWhereInput = { AND: and };
    const orderBy = [...SORTS[query.sort ?? 'featured'], { id: 'asc' as const }];

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({ where, orderBy, select: cardSelect, ...skipTake(query.page, query.limit) }),
      this.prisma.product.count({ where }),
    ]);
    return buildPage(rows.map(toProductCard), total, query.page, query.limit);
  }

  async facets(query: FacetsQueryDto) {
    const where = await this.baseWhere(query.category, query.search);
    if (!where) throw new NotFoundException('Category not found');

    const [agg, options, byCategory] = await Promise.all([
      this.prisma.product.aggregate({ where, _min: { minPrice: true }, _max: { maxPrice: true }, _count: { _all: true } }),
      this.prisma.productOption.findMany({
        where: { product: { AND: [where, { hasVariants: true }] } },
        orderBy: { position: 'asc' },
        select: {
          name: true,
          values: {
            where: { variants: { some: { variant: { isActive: true } } } },
            orderBy: { position: 'asc' },
            select: { value: true },
          },
        },
      }),
      this.prisma.product.groupBy({ by: ['categoryId'], where, _count: { _all: true } }),
    ]);

    const optionMap = new Map<string, string[]>();
    for (const opt of options) {
      const list = optionMap.get(opt.name) ?? [];
      for (const v of opt.values) if (!list.includes(v.value)) list.push(v.value);
      optionMap.set(opt.name, list);
    }

    const categories = await this.prisma.category.findMany({
      where: { id: { in: byCategory.map((c) => c.categoryId) } },
      select: { id: true, name: true, slug: true, sortOrder: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    const countMap = new Map(byCategory.map((c) => [c.categoryId, c._count._all]));

    return {
      priceRange: { min: toNumber(agg._min.minPrice), max: toNumber(agg._max.maxPrice) },
      options: [...optionMap.entries()]
        .filter(([, values]) => values.length > 0)
        .map(([name, values]) => ({ name, values })),
      categories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, count: countMap.get(c.id) ?? 0 })),
      total: agg._count._all,
    };
  }

  async bySlug(slug: string) {
    const row = await this.prisma.product.findFirst({
      where: { AND: [STOREFRONT_PRODUCT, { slug }] },
      include: detailInclude,
    });
    if (!row) throw new NotFoundException('Product not found');
    return toProductDetail(row);
  }

  async related(slug: string, limit: number) {
    const product = await this.prisma.product.findFirst({
      where: { AND: [STOREFRONT_PRODUCT, { slug }] },
      select: { id: true, categoryId: true, category: { select: { parentId: true } } },
    });
    if (!product) throw new NotFoundException('Product not found');

    const orderBy: Prisma.ProductOrderByWithRelationInput[] = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
    const sameCategory = await this.prisma.product.findMany({
      where: { AND: [STOREFRONT_PRODUCT, { id: { not: product.id }, categoryId: product.categoryId }] },
      orderBy,
      take: limit,
      select: cardSelect,
    });
    let rows = sameCategory;

    if (rows.length < limit) {
      const exclude = [product.id, ...rows.map((r) => r.id)];
      const family = product.category.parentId ?? product.categoryId;
      const more = await this.prisma.product.findMany({
        where: {
          AND: [
            STOREFRONT_PRODUCT,
            { id: { notIn: exclude } },
            { OR: [{ categoryId: family }, { category: { parentId: family } }] },
          ],
        },
        orderBy,
        take: limit - rows.length,
        select: cardSelect,
      });
      rows = [...rows, ...more];
    }
    if (rows.length < limit) {
      const exclude = [product.id, ...rows.map((r) => r.id)];
      const filler = await this.prisma.product.findMany({
        where: { AND: [STOREFRONT_PRODUCT, { id: { notIn: exclude } }] },
        orderBy,
        take: limit - rows.length,
        select: cardSelect,
      });
      rows = [...rows, ...filler];
    }
    return rows.map(toProductCard);
  }

  async sitemap() {
    const [products, categories] = await Promise.all([
      this.prisma.product.findMany({ where: STOREFRONT_PRODUCT, select: { slug: true, updatedAt: true }, orderBy: { updatedAt: 'desc' } }),
      this.prisma.category.findMany({
        where: { isActive: true, OR: [{ parentId: null }, { parent: { isActive: true } }] },
        select: { slug: true, updatedAt: true },
      }),
    ]);
    return { products, categories };
  }
}
