import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { FieldError } from '../common/filters/all-exceptions.filter';
import { buildPage, skipTake } from '../common/utils/pagination';
import { slugify, uniqueSlug } from '../common/utils/slug';
import { PrismaService } from '../database/prisma.service';
import {
  AdminProductQueryDto,
  BulkProductActionDto,
  CreateProductDto,
  ProductOptionInputDto,
  ProductStatusDto,
  ProductVariantInputDto,
  UpdateProductDto,
} from './dto/product.dto';
import { adminListSelect, detailInclude, toAdminDetail, toAdminListItem, variantInclude, variantOptions } from './product.mapper';
import { recomputeProductAggregates, resolvePrice, resolveVariantPrice } from './pricing';
import { buildSearchWhere } from './products.service';

interface PlannedOption {
  name: string;
  values: string[];
}

interface PlannedVariant {
  key: string;
  title: string;
  values: { option: string; value: string }[];
  sku: string | null;
  price: number | null;
  salePrice: number | null;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
}

interface VariantPlan {
  options: PlannedOption[];
  variants: PlannedVariant[];
}

const TX_OPTIONS = { timeout: 30_000, maxWait: 10_000 };

const combinationKey = (pairs: { option: string; value: string }[]) =>
  pairs
    .map((p) => `${p.option.toLowerCase()}=${p.value.toLowerCase()}`)
    .sort()
    .join('|');

const ADMIN_SORTS: Record<string, Prisma.ProductOrderByWithRelationInput[]> = {
  newest: [{ createdAt: 'desc' }],
  oldest: [{ createdAt: 'asc' }],
  name_asc: [{ name: 'asc' }],
  name_desc: [{ name: 'desc' }],
  price_asc: [{ minPrice: 'asc' }],
  price_desc: [{ maxPrice: 'desc' }],
  stock_asc: [{ stock: 'asc' }],
  sortOrder: [{ sortOrder: 'asc' }, { name: 'asc' }],
};

@Injectable()
export class AdminProductsService {
  private readonly logger = new Logger('Products');

  constructor(private readonly prisma: PrismaService) {}

  // ─── Queries ───────────────────────────────────────────────

  async list(query: AdminProductQueryDto) {
    const and: Prisma.ProductWhereInput[] = [{ deletedAt: null }];
    const search = buildSearchWhere(query.search);
    if (search) and.push(search);
    if (query.categoryId) and.push({ OR: [{ categoryId: query.categoryId }, { category: { parentId: query.categoryId } }] });
    if (query.status) and.push({ isActive: query.status === 'active' });
    if (query.featured !== undefined) and.push({ isFeatured: query.featured });
    if (query.stock === 'out') and.push({ stock: { lte: 0 } });
    if (query.stock === 'in') and.push({ stock: { gt: 0 } });
    if (query.stock === 'low') {
      and.push({ stock: { gt: 0 } }, { stock: { lte: this.prisma.product.fields.lowStockThreshold } });
    }

    const where: Prisma.ProductWhereInput = { AND: and };
    const orderBy = [...(ADMIN_SORTS[query.sort ?? 'newest'] ?? ADMIN_SORTS.newest), { id: 'asc' as const }];
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({ where, orderBy, select: adminListSelect, ...skipTake(query.page, query.limit) }),
      this.prisma.product.count({ where }),
    ]);
    return buildPage(rows.map(toAdminListItem), total, query.page, query.limit);
  }

  async get(id: string) {
    const row = await this.prisma.product.findFirst({ where: { id, deletedAt: null }, include: detailInclude });
    if (!row) throw new NotFoundException('Product not found');
    const ordersCount = await this.prisma.orderItem.count({ where: { productId: id } });
    return toAdminDetail(row, ordersCount);
  }

  // ─── Create / update ───────────────────────────────────────

  async create(dto: CreateProductDto, actorEmail: string) {
    await this.assertCategory(dto.categoryId);
    this.assertPricing(dto.price, dto.salePrice ?? null);
    const slug = await this.resolveSlug(dto.slug, dto.name);
    const plan = dto.options?.length ? this.planVariants(dto.options, dto.variants ?? [], dto.price, dto.salePrice ?? null) : null;
    await this.assertSkusAvailable(dto.sku ?? null, plan?.variants.map((v) => v.sku) ?? [], null);

    const images = dto.images ?? [];
    const id = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          categoryId: dto.categoryId,
          name: dto.name,
          slug,
          shortDescription: dto.shortDescription ?? null,
          description: dto.description ?? null,
          sku: dto.sku ?? null,
          price: dto.price,
          salePrice: dto.salePrice ?? null,
          stock: plan ? 0 : (dto.stock ?? 0),
          lowStockThreshold: dto.lowStockThreshold ?? 5,
          isFeatured: dto.isFeatured ?? false,
          isActive: dto.isActive ?? true,
          sortOrder: dto.sortOrder ?? 0,
          seoTitle: dto.seoTitle ?? null,
          seoDescription: dto.seoDescription ?? null,
          specifications: (dto.specifications ?? []) as unknown as Prisma.InputJsonValue,
          hasVariants: !!plan,
          thumbnailUrl: images[0]?.url ?? null,
          images: { create: images.map((img, position) => ({ url: img.url, alt: img.alt ?? null, position })) },
        },
      });
      if (plan) await this.syncVariants(tx, product.id, plan);
      await recomputeProductAggregates(tx, product.id);
      return product.id;
    }, TX_OPTIONS);

    this.logger.log(`${actorEmail} created product "${dto.name}" (${id})`);
    return this.get(id);
  }

  async update(id: string, dto: UpdateProductDto, actorEmail: string) {
    const existing = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: { options: { orderBy: { position: 'asc' }, include: { values: { orderBy: { position: 'asc' } } } } },
    });
    if (!existing) throw new NotFoundException('Product not found');

    if (dto.categoryId && dto.categoryId !== existing.categoryId) await this.assertCategory(dto.categoryId);

    const price = dto.price ?? Number(existing.price);
    const salePrice = dto.salePrice !== undefined ? dto.salePrice : existing.salePrice === null ? null : Number(existing.salePrice);
    this.assertPricing(price, salePrice);

    let slug: string | undefined;
    if (dto.slug && dto.slug !== existing.slug) slug = await this.resolveSlug(dto.slug, dto.name ?? existing.name, id);

    // Decide what happens to variants.
    let plan: VariantPlan | null | undefined; // undefined = untouched, null = remove all
    if (dto.options !== undefined) {
      plan = dto.options.length ? this.planVariants(dto.options, dto.variants ?? [], price, salePrice) : null;
    } else if (dto.variants !== undefined) {
      if (!existing.hasVariants) {
        throw new UnprocessableEntityException({
          message: 'Define product options before adding variants',
          errors: [{ field: 'options', message: 'Define product options before adding variants' }],
        });
      }
      const currentOptions = existing.options.map((o) => ({ name: o.name, values: o.values.map((v) => v.value) }));
      plan = this.planVariants(currentOptions, dto.variants, price, salePrice);
    }

    const skuToCheck = dto.sku !== undefined ? dto.sku : existing.sku;
    if (dto.sku !== undefined || plan) {
      const variantSkus = plan
        ? plan.variants.map((v) => v.sku)
        : (await this.prisma.productVariant.findMany({ where: { productId: id }, select: { sku: true } })).map((v) => v.sku);
      await this.assertSkusAvailable(skuToCheck ?? null, variantSkus, id);
    }

    await this.prisma.$transaction(async (tx) => {
      const data: Prisma.ProductUpdateInput = {
        name: dto.name,
        slug,
        category: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined,
        shortDescription: dto.shortDescription,
        description: dto.description,
        sku: dto.sku,
        price: dto.price,
        salePrice: dto.salePrice,
        lowStockThreshold: dto.lowStockThreshold,
        isFeatured: dto.isFeatured,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription,
        specifications: dto.specifications ? (dto.specifications as unknown as Prisma.InputJsonValue) : undefined,
      };

      if (dto.images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        data.images = { create: dto.images.map((img, position) => ({ url: img.url, alt: img.alt ?? null, position })) };
        data.thumbnailUrl = dto.images[0]?.url ?? null;
      }

      if (plan === null) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
        await tx.productOption.deleteMany({ where: { productId: id } });
        data.hasVariants = false;
        data.stock = dto.stock ?? existing.stock;
      } else if (plan) {
        data.hasVariants = true;
      } else if (!existing.hasVariants && dto.stock !== undefined) {
        data.stock = dto.stock;
      }

      await tx.product.update({ where: { id }, data });
      if (plan) await this.syncVariants(tx, id, plan);
      await recomputeProductAggregates(tx, id);
    }, TX_OPTIONS);

    this.logger.log(`${actorEmail} updated product "${dto.name ?? existing.name}" (${id})`);
    return this.get(id);
  }

  async setStatus(id: string, dto: ProductStatusDto, actorEmail: string) {
    const existing = await this.prisma.product.findFirst({ where: { id, deletedAt: null }, select: { id: true, name: true } });
    if (!existing) throw new NotFoundException('Product not found');
    const row = await this.prisma.product.update({
      where: { id },
      data: { isActive: dto.isActive, isFeatured: dto.isFeatured },
      select: adminListSelect,
    });
    this.logger.log(`${actorEmail} changed status of "${existing.name}" (${JSON.stringify(dto)})`);
    return toAdminListItem(row);
  }

  // ─── Delete ────────────────────────────────────────────────

  /**
   * Products referenced by orders are archived (soft-deleted) so order history stays intact;
   * their slug/SKU are released for reuse. Others are deleted permanently.
   */
  async remove(id: string, actorEmail: string): Promise<{ mode: 'deleted' | 'archived' }> {
    const product = await this.prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!product) throw new NotFoundException('Product not found');
    const mode = await this.prisma.$transaction((tx) => this.removeInTx(tx, product), TX_OPTIONS);
    this.logger.log(`${actorEmail} ${mode} product "${product.name}" (${id})`);
    return { mode };
  }

  private async removeInTx(
    tx: Prisma.TransactionClient,
    product: { id: string; slug: string; sku: string | null },
  ): Promise<'deleted' | 'archived'> {
    const orders = await tx.orderItem.count({ where: { productId: product.id } });
    if (orders === 0) {
      await tx.product.delete({ where: { id: product.id } });
      return 'deleted';
    }
    const suffix = randomBytes(3).toString('hex');
    await tx.productVariant.updateMany({ where: { productId: product.id }, data: { sku: null, isActive: false } });
    await tx.product.update({
      where: { id: product.id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        isFeatured: false,
        slug: `${product.slug}-archived-${suffix}`.slice(0, 120),
        sku: product.sku ? `${product.sku}-archived-${suffix}` : null,
      },
    });
    return 'archived';
  }

  async bulk(dto: BulkProductActionDto, actorEmail: string) {
    const ids = [...new Set(dto.ids)];
    let affected = 0;
    if (dto.action === 'delete') {
      const products = await this.prisma.product.findMany({ where: { id: { in: ids }, deletedAt: null } });
      await this.prisma.$transaction(async (tx) => {
        for (const p of products) await this.removeInTx(tx, p);
      }, TX_OPTIONS);
      affected = products.length;
    } else {
      const data: Prisma.ProductUpdateManyMutationInput =
        dto.action === 'activate'
          ? { isActive: true }
          : dto.action === 'deactivate'
            ? { isActive: false }
            : { isFeatured: dto.action === 'feature' };
      affected = (await this.prisma.product.updateMany({ where: { id: { in: ids }, deletedAt: null }, data })).count;
    }
    this.logger.log(`${actorEmail} bulk ${dto.action} on ${affected} products`);
    return { affected };
  }

  // ─── Variants ──────────────────────────────────────────────

  /** Validates option groups + variant rows and normalises them into a sync plan. */
  private planVariants(
    rawOptions: ProductOptionInputDto[] | PlannedOption[],
    rawVariants: ProductVariantInputDto[],
    productPrice: number,
    productSalePrice: number | null,
  ): VariantPlan {
    const errors: FieldError[] = [];
    const options: PlannedOption[] = [];
    const seenNames = new Set<string>();

    rawOptions.forEach((opt, i) => {
      const name = opt.name.trim();
      if (!name) return errors.push({ field: `options.${i}.name`, message: 'Option name is required' });
      if (seenNames.has(name.toLowerCase())) {
        return errors.push({ field: `options.${i}.name`, message: `Option "${name}" is defined twice` });
      }
      seenNames.add(name.toLowerCase());
      const values: string[] = [];
      const seenValues = new Set<string>();
      for (const raw of opt.values) {
        const value = raw.trim();
        if (!value || seenValues.has(value.toLowerCase())) continue;
        seenValues.add(value.toLowerCase());
        values.push(value);
      }
      if (!values.length) errors.push({ field: `options.${i}.values`, message: `Add at least one value for "${name}"` });
      options.push({ name, values });
    });

    if (!rawVariants.length) {
      errors.push({ field: 'variants', message: 'Add at least one variant for the selected options' });
    }

    const variants: PlannedVariant[] = [];
    const seenKeys = new Set<string>();
    rawVariants.forEach((v, i) => {
      const entries = Object.entries(v.options ?? {});
      const pairs: { option: string; value: string }[] = [];
      for (const option of options) {
        const match = entries.find(([k]) => k.trim().toLowerCase() === option.name.toLowerCase());
        const value = match ? String(match[1]).trim() : '';
        const canonical = option.values.find((val) => val.toLowerCase() === value.toLowerCase());
        if (!canonical) {
          errors.push({ field: `variants.${i}.options`, message: `Choose a valid "${option.name}" for variant ${i + 1}` });
          return;
        }
        pairs.push({ option: option.name, value: canonical });
      }
      if (entries.length !== options.length) {
        errors.push({ field: `variants.${i}.options`, message: `Variant ${i + 1} must specify exactly one value per option` });
        return;
      }
      const key = combinationKey(pairs);
      if (seenKeys.has(key)) {
        errors.push({ field: `variants.${i}.options`, message: `Variant "${pairs.map((p) => p.value).join(' / ')}" is duplicated` });
        return;
      }
      seenKeys.add(key);

      const pricing = resolveVariantPrice(
        { price: productPrice, salePrice: productSalePrice },
        { price: v.price ?? null, salePrice: v.salePrice ?? null },
      );
      const rawSale = v.salePrice ?? null;
      if (rawSale !== null && pricing.salePrice === null) {
        errors.push({ field: `variants.${i}.salePrice`, message: 'Sale price must be lower than the price' });
      }

      variants.push({
        key,
        title: pairs.map((p) => p.value).join(' / '),
        values: pairs,
        sku: v.sku ?? null,
        price: v.price ?? null,
        salePrice: rawSale,
        stock: v.stock,
        imageUrl: v.imageUrl ?? null,
        isActive: v.isActive ?? true,
      });
    });

    if (errors.length) throw new UnprocessableEntityException({ message: errors[0].message, errors });
    return { options, variants };
  }

  /** Applies a plan: upserts option groups/values and matches variants by combination to keep their IDs. */
  private async syncVariants(tx: Prisma.TransactionClient, productId: string, plan: VariantPlan) {
    await tx.productOption.deleteMany({ where: { productId, name: { notIn: plan.options.map((o) => o.name) } } });

    const valueIds = new Map<string, string>(); // "option=value" (lowercase) → id
    for (const [position, opt] of plan.options.entries()) {
      const option = await tx.productOption.upsert({
        where: { productId_name: { productId, name: opt.name } },
        create: { productId, name: opt.name, position },
        update: { position },
      });
      await tx.productOptionValue.deleteMany({ where: { optionId: option.id, value: { notIn: opt.values } } });
      for (const [valuePosition, value] of opt.values.entries()) {
        const row = await tx.productOptionValue.upsert({
          where: { optionId_value: { optionId: option.id, value } },
          create: { optionId: option.id, value, position: valuePosition },
          update: { position: valuePosition },
        });
        valueIds.set(`${opt.name.toLowerCase()}=${value.toLowerCase()}`, row.id);
      }
    }

    const existing = await tx.productVariant.findMany({ where: { productId }, include: variantInclude });
    const byKey = new Map<string, string>();
    const stale: string[] = [];
    for (const variant of existing) {
      const opts = variantOptions(variant);
      const key = combinationKey(Object.entries(opts).map(([option, value]) => ({ option, value })));
      if (Object.keys(opts).length !== plan.options.length || byKey.has(key)) stale.push(variant.id);
      else byKey.set(key, variant.id);
    }
    const planned = new Set(plan.variants.map((v) => v.key));
    for (const [key, id] of byKey) if (!planned.has(key)) stale.push(id);
    if (stale.length) await tx.productVariant.deleteMany({ where: { id: { in: stale } } });

    // Release SKUs first so SKUs can be swapped between variants in one save.
    const kept = [...byKey.entries()].filter(([key]) => planned.has(key)).map(([, id]) => id);
    if (kept.length) await tx.productVariant.updateMany({ where: { id: { in: kept } }, data: { sku: null } });

    for (const [position, v] of plan.variants.entries()) {
      const data = {
        title: v.title,
        sku: v.sku,
        price: v.price,
        salePrice: v.salePrice,
        stock: v.stock,
        imageUrl: v.imageUrl,
        isActive: v.isActive,
        position,
      };
      const existingId = byKey.get(v.key);
      if (existingId) {
        await tx.productVariant.update({ where: { id: existingId }, data });
      } else {
        await tx.productVariant.create({
          data: {
            ...data,
            productId,
            optionValues: {
              create: v.values.map((p) => ({ optionValueId: valueIds.get(`${p.option.toLowerCase()}=${p.value.toLowerCase()}`)! })),
            },
          },
        });
      }
    }
  }

  // ─── Validation helpers ────────────────────────────────────

  private assertPricing(price: number, salePrice: number | null) {
    if (salePrice !== null && salePrice !== undefined && resolvePrice(price, salePrice).salePrice === null) {
      throw new UnprocessableEntityException({
        message: 'Sale price must be lower than the regular price',
        errors: [{ field: 'salePrice', message: 'Sale price must be lower than the regular price' }],
      });
    }
  }

  private async assertCategory(categoryId: string) {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
    if (!category) {
      throw new BadRequestException({
        message: 'Category not found',
        errors: [{ field: 'categoryId', message: 'Select a valid category' }],
      });
    }
  }

  /** SKUs must be unique across products and variants. */
  private async assertSkusAvailable(productSku: string | null, variantSkus: (string | null)[], productId: string | null) {
    const all = [productSku, ...variantSkus].filter((s): s is string => !!s);
    const seen = new Set<string>();
    for (const sku of all) {
      const k = sku.toLowerCase();
      if (seen.has(k)) {
        throw new ConflictException({
          message: `SKU "${sku}" is used more than once in this product`,
          errors: [{ field: 'sku', message: `SKU "${sku}" is used more than once` }],
        });
      }
      seen.add(k);
    }
    if (!all.length) return;
    const insensitive = all.map((sku) => ({ sku: { equals: sku, mode: 'insensitive' as const } }));
    const [product, variant] = await Promise.all([
      this.prisma.product.findFirst({
        where: { OR: insensitive, ...(productId ? { NOT: { id: productId } } : {}) },
        select: { sku: true, name: true },
      }),
      this.prisma.productVariant.findFirst({
        where: { OR: insensitive, ...(productId ? { NOT: { productId } } : {}) },
        select: { sku: true, product: { select: { name: true } } },
      }),
    ]);
    const clash = product ? { sku: product.sku, name: product.name } : variant ? { sku: variant.sku, name: variant.product.name } : null;
    if (clash) {
      const field = productSku && clash.sku?.toLowerCase() === productSku.toLowerCase() ? 'sku' : 'variants';
      throw new ConflictException({
        message: `SKU "${clash.sku}" is already used by "${clash.name}"`,
        errors: [{ field, message: `SKU "${clash.sku}" is already used by "${clash.name}"` }],
      });
    }
  }

  private async resolveSlug(explicit: string | undefined, name: string, selfId?: string) {
    const exists = async (slug: string) =>
      !!(await this.prisma.product.findFirst({ where: { slug, ...(selfId ? { NOT: { id: selfId } } : {}) }, select: { id: true } }));
    if (explicit) {
      const slug = slugify(explicit);
      if (await exists(slug)) {
        throw new ConflictException({
          message: 'This slug is already used by another product',
          errors: [{ field: 'slug', message: 'This slug is already used by another product' }],
        });
      }
      return slug;
    }
    return uniqueSlug(name, exists, 'product');
  }
}
