import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiConflictResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuth, AuthenticatedAdmin, CurrentAdmin } from '../common/decorators/auth.decorators';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { CategoriesService } from './categories.service';
import {
  AdminCategoryQueryDto,
  CreateCategoryDto,
  DeleteCategoryQueryDto,
  PublicCategoryQueryDto,
  ReorderCategoriesDto,
  UpdateCategoryDto,
} from './dto/category.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ResponseMessage('Categories fetched successfully')
  @ApiOperation({ summary: 'Active categories as a tree (or flat list with ?flat=true)' })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
        message: 'Categories fetched successfully',
        data: [
          {
            id: 'clx0cat0001',
            name: 'Toys',
            slug: 'toys',
            description: 'Everyday play favourites',
            imageUrl: 'http://localhost:4000/uploads/seed/categories/toys.webp',
            parentId: null,
            sortOrder: 0,
            productCount: 14,
            children: [{ id: 'clx0cat0002', name: 'Cars & Vehicles', slug: 'cars-and-vehicles', productCount: 5, children: [] }],
          },
        ],
      },
    },
  })
  list(@Query() query: PublicCategoryQueryDto) {
    return this.categories.publicTree(query.flat ?? false);
  }

  @Get(':slug')
  @ResponseMessage('Category fetched successfully')
  @ApiOperation({ summary: 'Category details by slug' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  get(@Param('slug') slug: string) {
    return this.categories.publicBySlug(slug);
  }
}

@ApiTags('Admin · Categories')
@Controller('admin/categories')
@AdminAuth()
export class AdminCategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ResponseMessage('Categories fetched successfully')
  @ApiOperation({ summary: 'Search / filter / paginate categories' })
  list(@Query() query: AdminCategoryQueryDto) {
    return this.categories.adminList(query);
  }

  @Get('options')
  @ResponseMessage('Category options fetched')
  @ApiOperation({ summary: 'All categories (id, name, parentId) for select inputs' })
  options() {
    return this.categories.adminOptions();
  }

  @Patch('reorder')
  @ResponseMessage('Category order saved')
  @ApiOperation({ summary: 'Bulk update sort order' })
  reorder(@Body() dto: ReorderCategoriesDto) {
    return this.categories.reorder(dto);
  }

  @Get(':id')
  @ResponseMessage('Category fetched successfully')
  @ApiNotFoundResponse()
  get(@Param('id') id: string) {
    return this.categories.adminGet(id);
  }

  @Post()
  @ResponseMessage('Category created')
  @ApiOperation({ summary: 'Create category' })
  @ApiConflictResponse({ description: 'Slug already in use / invalid parent' })
  create(@Body() dto: CreateCategoryDto, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.categories.create(dto, admin.email);
  }

  @Put(':id')
  @ResponseMessage('Category updated')
  @ApiOperation({ summary: 'Update category (partial)' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.categories.update(id, dto, admin.email);
  }

  @Delete(':id')
  @ResponseMessage('Category deleted')
  @ApiOperation({
    summary: 'Delete category',
    description: 'Fails with 409 when the category has sub-categories, or has products and `moveProductsTo` is not provided.',
  })
  @ApiConflictResponse({ description: 'Category in use' })
  remove(@Param('id') id: string, @Query() query: DeleteCategoryQueryDto, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.categories.remove(id, query.moveProductsTo, admin.email);
  }
}
