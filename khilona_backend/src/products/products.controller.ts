import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiConflictResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuth, AuthenticatedAdmin, CurrentAdmin } from '../common/decorators/auth.decorators';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { AdminProductsService } from './admin-products.service';
import {
  AdminProductQueryDto,
  BulkProductActionDto,
  CreateProductDto,
  FacetsQueryDto,
  ProductStatusDto,
  PublicProductQueryDto,
  RelatedQueryDto,
  UpdateProductDto,
} from './dto/product.dto';
import { ProductsService } from './products.service';

const CARD_EXAMPLE = {
  id: 'clx0prod0001',
  name: 'Turbo Racer Remote Control Car',
  slug: 'turbo-racer-remote-control-car',
  shortDescription: '2.4 GHz high-speed RC car with rechargeable battery',
  thumbnailUrl: 'http://localhost:4000/uploads/seed/products/turbo-racer-1.webp',
  price: 1499,
  salePrice: 1199,
  effectivePrice: 1199,
  discountPercent: 20,
  minPrice: 1199,
  maxPrice: 1299,
  stock: 18,
  inStock: true,
  stockStatus: 'IN_STOCK',
  isFeatured: true,
  hasVariants: true,
  category: { id: 'clx0cat0002', name: 'Cars & Vehicles', slug: 'cars-and-vehicles' },
  createdAt: '2026-10-01T10:00:00.000Z',
};

@ApiTags('Products')
@Controller()
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get('products')
  @ResponseMessage('Products fetched successfully')
  @ApiOperation({ summary: 'Search, filter, sort and paginate storefront products' })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
        message: 'Products fetched successfully',
        data: { items: [CARD_EXAMPLE], meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false } },
      },
    },
  })
  list(@Query() query: PublicProductQueryDto) {
    return this.products.list(query);
  }

  @Get('products/facets')
  @ResponseMessage('Filters fetched successfully')
  @ApiOperation({ summary: 'Available filters (price range, options, categories) for a listing' })
  facets(@Query() query: FacetsQueryDto) {
    return this.products.facets(query);
  }

  @Get('products/:slug')
  @ResponseMessage('Product fetched successfully')
  @ApiOperation({ summary: 'Product details with images, options and variants' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  bySlug(@Param('slug') slug: string) {
    return this.products.bySlug(slug);
  }

  @Get('products/:slug/related')
  @ResponseMessage('Related products fetched successfully')
  @ApiOperation({ summary: 'Related products (same category first)' })
  related(@Param('slug') slug: string, @Query() query: RelatedQueryDto) {
    return this.products.related(slug, query.limit);
  }

  @Get('sitemap')
  @ResponseMessage('Sitemap data fetched')
  @ApiOperation({ summary: 'Slugs + last modified dates for sitemap generation' })
  sitemap() {
    return this.products.sitemap();
  }
}

@ApiTags('Admin · Products')
@Controller('admin/products')
@AdminAuth()
export class AdminProductsController {
  constructor(private readonly products: AdminProductsService) {}

  @Get()
  @ResponseMessage('Products fetched successfully')
  @ApiOperation({ summary: 'Search / filter / paginate products (admin)' })
  list(@Query() query: AdminProductQueryDto) {
    return this.products.list(query);
  }

  @Patch('bulk')
  @ResponseMessage('Bulk action applied')
  @ApiOperation({ summary: 'Bulk activate / deactivate / feature / unfeature / delete' })
  bulk(@Body() dto: BulkProductActionDto, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.products.bulk(dto, admin.email);
  }

  @Get(':id')
  @ResponseMessage('Product fetched successfully')
  @ApiNotFoundResponse()
  get(@Param('id') id: string) {
    return this.products.get(id);
  }

  @Post()
  @ResponseMessage('Product created')
  @ApiOperation({ summary: 'Create product (with images, options and variants)' })
  @ApiConflictResponse({ description: 'Duplicate SKU or slug' })
  create(@Body() dto: CreateProductDto, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.products.create(dto, admin.email);
  }

  @Put(':id')
  @ResponseMessage('Product updated')
  @ApiOperation({ summary: 'Update product (partial). Variants are matched by option combination.' })
  @ApiConflictResponse({ description: 'Duplicate SKU or slug' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.products.update(id, dto, admin.email);
  }

  @Patch(':id/status')
  @ResponseMessage('Product status updated')
  @ApiOperation({ summary: 'Quick toggle active / featured' })
  status(@Param('id') id: string, @Body() dto: ProductStatusDto, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.products.setStatus(id, dto, admin.email);
  }

  @Delete(':id')
  @ResponseMessage('Product removed')
  @ApiOperation({
    summary: 'Delete product',
    description: 'Products that appear in orders are archived (soft-deleted) instead of being removed. Response `mode` tells which happened.',
  })
  remove(@Param('id') id: string, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.products.remove(id, admin.email);
  }
}
