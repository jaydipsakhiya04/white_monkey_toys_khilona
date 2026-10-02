import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Category, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { buildPage, skipTake } from '../common/utils/pagination';
import { slugify, uniqueSlug } from '../common/utils/slug';
import {
  AdminCategoryQueryDto,
  CreateCategoryDto,
  ReorderCategoriesDto,
  UpdateCategoryDto,
} from './dto/category.dto';

/** Products visible on the storefront. */
export const VISIBLE_PRODUCT: Prisma.ProductWhereInput = { isActive: true, deletedAt: null };

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  productCount: number;
  children: CategorySummary[];
}

const adminInclude = {
  parent: { select: { id: true, name: true } },
  _count: { select: { products: { where: { deletedAt: null } }, children: true } },
} satisfies Prisma.CategoryInclude;

type AdminCategoryRow = Prisma.CategoryGetPayload<{ include: typeof adminInclude }>;

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger('Categories');

  constructor(private readonly prisma: PrismaService) {}

  // ─── Public ────────────────────────────────────────────────

  /** Active categories (whose parent, if any, is active) with storefront product counts. */
  async publicTree(flat = false): Promise<CategorySummary[]> {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true, OR: [{ parentId: null }, { parent: { isActive: true } }] },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    const counts = await this.prisma.product.groupBy({
      by: ['categoryId'],
      where: VISIBLE_PRODUCT,
      _count: { _all: true },
    });
    const countMap = new Map(counts.map((c) => [c.categoryId, c._count._all]));

    const toSummary = (c: Category): CategorySummary => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: c.imageUrl,
      parentId: c.parentId,
      sortOrder: c.sortOrder,
      productCount: countMap.get(c.id) ?? 0,
      children: [],
    });

    const summaries = categories.map(toSummary);
    const byId = new Map(summaries.map((s) => [s.id, s]));
    for (const s of summaries) {
      if (s.parentId) {
        const parent = byId.get(s.parentId);
        if (parent) parent.productCount += s.productCount;
      }
    }
    if (flat) return summaries;

    const roots: CategorySummary[] = [];
    for (const s of summaries) {
      if (s.parentId && byId.has(s.parentId)) byId.get(s.parentId)!.children.push(s);
      else if (!s.parentId) roots.push(s);
    }
    return roots;
  }

  async publicBySlug(slug: string) {
    const category = await this.prisma.category.findFirst({
      where: { slug, isActive: true, OR: [{ parentId: null }, { parent: { isActive: true } }] },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
      },
    });
    if (!category) throw new NotFoundException('Category not found');

    const ids = [category.id, ...category.children.map((c) => c.id)];
    const counts = await this.prisma.product.groupBy({
      by: ['categoryId'],
      where: { ...VISIBLE_PRODUCT, categoryId: { in: ids } },
      _count: { _all: true },
    });
    const countMap = new Map(counts.map((c) => [c.categoryId, c._count._all]));
    const children: CategorySummary[] = category.children.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: c.imageUrl,
      parentId: c.parentId,
      sortOrder: c.sortOrder,
      productCount: countMap.get(c.id) ?? 0,
      children: [],
    }));

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      parentId: category.parentId,
      sortOrder: category.sortOrder,
      productCount: ids.reduce((sum, id) => sum + (countMap.get(id) ?? 0), 0),
      seoTitle: category.seoTitle,
      seoDescription: category.seoDescription,
      parent: category.parent,
      children,
      updatedAt: category.updatedAt,
    };
  }

  /** Ids of an active category plus its active children (used for product filtering). */
  async activeCategoryIdsBySlug(slug: string): Promise<string[] | null> {
    const category = await this.prisma.category.findFirst({
      where: { slug, isActive: true, OR: [{ parentId: null }, { parent: { isActive: true } }] },
      select: { id: true, children: { where: { isActive: true }, select: { id: true } } },
    });
    return category ? [category.id, ...category.children.map((c) => c.id)] : null;
  }

  // ─── Admin ─────────────────────────────────────────────────

  async adminList(query: AdminCategoryQueryDto) {
    const where: Prisma.CategoryWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status) where.isActive = query.status === 'active';
    if (query.parentId) where.parentId = query.parentId === 'root' ? null : query.parentId;

    const orderBy: Prisma.CategoryOrderByWithRelationInput[] =
      query.sort === 'name'
        ? [{ name: 'asc' }]
        : query.sort === 'newest'
          ? [{ createdAt: 'desc' }]
          : query.sort === 'products'
            ? [{ products: { _count: 'desc' } }, { name: 'asc' }]
            : [{ sortOrder: 'asc' }, { name: 'asc' }];

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        orderBy: [...orderBy, { id: 'asc' }],
        include: adminInclude,
        ...skipTake(query.page, query.limit),
      }),
      this.prisma.category.count({ where }),
    ]);
    return buildPage(await this.present(rows), total, query.page, query.limit);
  }

  async adminOptions() {
    return this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, parentId: true, isActive: true },
    });
  }

  async adminGet(id: string) {
    const row = await this.prisma.category.findUnique({ where: { id }, include: adminInclude });
    if (!row) throw new NotFoundException('Category not found');
    return (await this.present([row]))[0];
  }

  async create(dto: CreateCategoryDto, actorEmail: string) {
    await this.assertValidParent(dto.parentId ?? null, null);
    const slug = await this.resolveSlug(dto.slug, dto.name);
    const sortOrder =
      dto.sortOrder ??
      ((await this.prisma.category.aggregate({ _max: { sortOrder: true }, where: { parentId: dto.parentId ?? null } }))
        ._max.sortOrder ?? -1) + 1;

    const created = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description ?? null,
        imageUrl: dto.imageUrl ?? null,
        isActive: dto.isActive ?? true,
        sortOrder,
        parentId: dto.parentId ?? null,
        seoTitle: dto.seoTitle ?? null,
        seoDescription: dto.seoDescription ?? null,
      },
      include: adminInclude,
    });
    this.logger.log(`${actorEmail} created category "${created.name}"`);
    return (await this.present([created]))[0];
  }

  async update(id: string, dto: UpdateCategoryDto, actorEmail: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { children: true } } },
    });
    if (!existing) throw new NotFoundException('Category not found');

    if (dto.parentId !== undefined && dto.parentId !== existing.parentId) {
      if (dto.parentId && existing._count.children > 0) {
        throw new ConflictException({
          message: 'A category with sub-categories cannot itself become a sub-category',
          errors: [{ field: 'parentId', message: 'Move its sub-categories first' }],
        });
      }
      await this.assertValidParent(dto.parentId ?? null, id);
    }

    let slug: string | undefined;
    if (dto.slug && dto.slug !== existing.slug) slug = await this.resolveSlug(dto.slug, dto.name ?? existing.name, id);

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        imageUrl: dto.imageUrl,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
        parentId: dto.parentId,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription,
      },
      include: adminInclude,
    });
    this.logger.log(`${actorEmail} updated category "${updated.name}"`);
    return (await this.present([updated]))[0];
  }

  async reorder(dto: ReorderCategoriesDto) {
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.category.updateMany({ where: { id: item.id }, data: { sortOrder: item.sortOrder } }),
      ),
    );
    return null;
  }

  /**
   * Deleting never silently removes products:
   * - categories with sub-categories cannot be deleted;
   * - categories with products require `moveProductsTo`, which reassigns them first
   *   (archived products referenced by old orders are moved too).
   */
  async remove(id: string, moveProductsTo: string | undefined, actorEmail: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { children: true, products: true } } },
    });
    if (!category) throw new NotFoundException('Category not found');

    if (category._count.children > 0) {
      throw new ConflictException({
        message: `"${category.name}" has ${category._count.children} sub-categor${category._count.children === 1 ? 'y' : 'ies'}. Move or delete them first.`,
        errors: [{ field: 'children', message: 'Category has sub-categories' }],
      });
    }

    const productTotal = category._count.products;
    if (productTotal > 0 && !moveProductsTo) {
      const live = await this.prisma.product.count({ where: { categoryId: id, deletedAt: null } });
      const archived = productTotal - live;
      const parts = [
        live ? `${live} product${live === 1 ? '' : 's'}` : null,
        archived ? `${archived} archived product${archived === 1 ? '' : 's'} referenced by past orders` : null,
      ].filter(Boolean);
      throw new ConflictException({
        message: `"${category.name}" contains ${parts.join(' and ')}. Choose a category to move them to before deleting.`,
        errors: [{ field: 'moveProductsTo', message: 'Select a category to move the products to' }],
      });
    }

    if (moveProductsTo) {
      if (moveProductsTo === id) throw new BadRequestException('Choose a different category to move products to');
      const target = await this.prisma.category.findUnique({ where: { id: moveProductsTo } });
      if (!target) {
        throw new BadRequestException({
          message: 'Target category not found',
          errors: [{ field: 'moveProductsTo', message: 'Target category not found' }],
        });
      }
    }

    const moved = await this.prisma.$transaction(async (tx) => {
      const result = moveProductsTo
        ? await tx.product.updateMany({ where: { categoryId: id }, data: { categoryId: moveProductsTo } })
        : { count: 0 };
      await tx.category.delete({ where: { id } });
      return result.count;
    });
    this.logger.log(`${actorEmail} deleted category "${category.name}" (moved ${moved} products)`);
    return { movedProducts: moved };
  }

  // ─── Helpers ───────────────────────────────────────────────

  private async assertValidParent(parentId: string | null, selfId: string | null) {
    if (!parentId) return;
    if (parentId === selfId) {
      throw new ConflictException({
        message: 'A category cannot be its own parent',
        errors: [{ field: 'parentId', message: 'A category cannot be its own parent' }],
      });
    }
    const parent = await this.prisma.category.findUnique({ where: { id: parentId } });
    if (!parent) {
      throw new BadRequestException({
        message: 'Parent category not found',
        errors: [{ field: 'parentId', message: 'Parent category not found' }],
      });
    }
    if (parent.parentId) {
      throw new ConflictException({
        message: 'Sub-categories can only be one level deep',
        errors: [{ field: 'parentId', message: 'Choose a top-level category as parent' }],
      });
    }
  }

  private async resolveSlug(explicit: string | undefined, name: string, selfId?: string) {
    const exists = async (slug: string) =>
      !!(await this.prisma.category.findFirst({ where: { slug, ...(selfId ? { NOT: { id: selfId } } : {}) } }));
    if (explicit) {
      const slug = slugify(explicit);
      if (!slug) throw new BadRequestException({ message: 'Invalid slug', errors: [{ field: 'slug', message: 'Invalid slug' }] });
      if (await exists(slug)) {
        throw new ConflictException({
          message: 'This slug is already used by another category',
          errors: [{ field: 'slug', message: 'This slug is already used by another category' }],
        });
      }
      return slug;
    }
    return uniqueSlug(name, exists, 'category');
  }

  /**
   * productCount includes products of sub-categories (consistent with the storefront);
   * directProductCount only counts products assigned to the category itself.
   */
  private async present(rows: AdminCategoryRow[]) {
    const parents = rows.filter((r) => r._count.children > 0).map((r) => r.id);
    const childTotals = new Map<string, number>();
    if (parents.length) {
      const children = await this.prisma.category.findMany({
        where: { parentId: { in: parents } },
        select: { parentId: true, _count: { select: { products: { where: { deletedAt: null } } } } },
      });
      for (const c of children) childTotals.set(c.parentId!, (childTotals.get(c.parentId!) ?? 0) + c._count.products);
    }
    return rows.map(({ _count, ...rest }) => ({
      ...rest,
      productCount: _count.products + (childTotals.get(rest.id) ?? 0),
      directProductCount: _count.products,
      childrenCount: _count.children,
    }));
  }
}
