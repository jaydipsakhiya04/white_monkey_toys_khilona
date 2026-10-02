import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { EmptyToNull, EmptyToUndefined, ToBoolean, ToInt, ToNumber } from '../../common/decorators/transforms';

const URL_OPTS = { protocols: ['http', 'https'], require_protocol: true, require_tld: false };
const MONEY = { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false };
const SKU_RULE = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,59}$/;
const SKU_MESSAGE = 'SKU may contain letters, numbers, dot, dash, slash and underscore (max 60)';

// ─── Public queries ──────────────────────────────────────────

export const PUBLIC_SORTS = ['featured', 'newest', 'price_asc', 'price_desc', 'name_asc', 'name_desc'] as const;
export type PublicSort = (typeof PUBLIC_SORTS)[number];

export class PublicProductQueryDto {
  @ApiPropertyOptional({ example: 'toys', description: 'Category slug (includes child categories)' })
  @IsOptional() @EmptyToUndefined() @IsString() @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ example: 'car' })
  @IsOptional() @EmptyToUndefined() @IsString() @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional() @ToNumber() @IsNumber({}, { message: 'minPrice must be a number' }) @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional() @ToNumber() @IsNumber({}, { message: 'maxPrice must be a number' }) @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional() @IsOptional() @ToBoolean() @IsBoolean()
  inStock?: boolean;

  @ApiPropertyOptional() @IsOptional() @ToBoolean() @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ example: 'Color:Red,Color:Blue,Age:3+', description: 'Same name = OR, different names = AND' })
  @IsOptional() @EmptyToUndefined() @IsString() @MaxLength(500)
  options?: string;

  @ApiPropertyOptional({ enum: PUBLIC_SORTS, default: 'featured' })
  @IsOptional() @EmptyToUndefined() @IsIn(PUBLIC_SORTS as unknown as string[])
  sort?: PublicSort;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @ToInt() @IsInt() @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 60 })
  @IsOptional() @ToInt() @IsInt() @Min(1) @Max(60)
  limit: number = 20;
}

export class FacetsQueryDto {
  @ApiPropertyOptional() @IsOptional() @EmptyToUndefined() @IsString() @MaxLength(100)
  category?: string;

  @ApiPropertyOptional() @IsOptional() @EmptyToUndefined() @IsString() @MaxLength(100)
  search?: string;
}

export class RelatedQueryDto {
  @ApiPropertyOptional({ default: 8, maximum: 24 })
  @IsOptional() @ToInt() @IsInt() @Min(1) @Max(24)
  limit: number = 8;
}

// ─── Admin queries ───────────────────────────────────────────

export const ADMIN_SORTS = ['newest', 'oldest', 'name_asc', 'name_desc', 'price_asc', 'price_desc', 'stock_asc', 'sortOrder'] as const;

export class AdminProductQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @EmptyToUndefined() @IsString() @MaxLength(100)
  search?: string;

  @ApiPropertyOptional() @IsOptional() @EmptyToUndefined() @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @IsOptional() @EmptyToUndefined() @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @ApiPropertyOptional({ enum: ['in', 'low', 'out'] })
  @IsOptional() @EmptyToUndefined() @IsIn(['in', 'low', 'out'])
  stock?: 'in' | 'low' | 'out';

  @ApiPropertyOptional() @IsOptional() @ToBoolean() @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ enum: ADMIN_SORTS, default: 'newest' })
  @IsOptional() @EmptyToUndefined() @IsIn(ADMIN_SORTS as unknown as string[])
  sort?: (typeof ADMIN_SORTS)[number];
}

// ─── Admin input ─────────────────────────────────────────────

export class ProductImageInputDto {
  @ApiProperty({ example: 'http://localhost:4000/uploads/products/2026/10/abc.webp' })
  @IsUrl(URL_OPTS, { message: 'Image URL must be a valid URL' })
  @MaxLength(500)
  url: string;

  @ApiPropertyOptional({ example: 'Red remote control car, front view' })
  @IsOptional() @EmptyToNull() @IsString() @MaxLength(160)
  alt?: string | null;
}

export class SpecificationInputDto {
  @ApiProperty({ example: 'Recommended age' })
  @IsString() @Length(1, 60)
  label: string;

  @ApiProperty({ example: '6 years +' })
  @IsString() @Length(1, 300)
  value: string;
}

export class ProductOptionInputDto {
  @ApiProperty({ example: 'Color' })
  @IsString() @Length(1, 40)
  name: string;

  @ApiProperty({ example: ['Red', 'Blue'] })
  @IsArray() @ArrayMinSize(1, { message: 'Each option needs at least one value' }) @ArrayMaxSize(50)
  @IsString({ each: true }) @Length(1, 40, { each: true })
  values: string[];
}

export class ProductVariantInputDto {
  @ApiProperty({ example: { Color: 'Red', Size: 'Large' } })
  @IsObject()
  options: Record<string, string>;

  @ApiPropertyOptional({ example: 'RC-CAR-RED-L', nullable: true })
  @IsOptional() @EmptyToNull() @IsString() @Matches(SKU_RULE, { message: SKU_MESSAGE })
  sku?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'null = inherit product price' })
  @IsOptional() @IsNumber(MONEY) @Min(0.01) @Max(10_000_000)
  price?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional() @IsNumber(MONEY) @Min(0.01) @Max(10_000_000)
  salePrice?: number | null;

  @ApiProperty({ example: 10 })
  @IsInt() @Min(0) @Max(1_000_000)
  stock: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional() @EmptyToNull() @IsUrl(URL_OPTS) @MaxLength(500)
  imageUrl?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Turbo Racer Remote Control Car' })
  @IsString() @Length(2, 140, { message: 'Name must be 2–140 characters' })
  name: string;

  @ApiPropertyOptional({ example: 'turbo-racer-remote-control-car' })
  @IsOptional() @EmptyToUndefined() @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Slug may only contain lowercase letters, numbers and hyphens' })
  @MaxLength(90)
  slug?: string;

  @ApiProperty({ example: 'clx0cat0002' })
  @IsString() @Length(1, 40, { message: 'Category is required' })
  categoryId: string;

  @ApiPropertyOptional() @IsOptional() @EmptyToNull() @IsString() @MaxLength(300)
  shortDescription?: string | null;

  @ApiPropertyOptional() @IsOptional() @EmptyToNull() @IsString() @MaxLength(10000)
  description?: string | null;

  @ApiPropertyOptional({ example: 'RC-CAR-001', nullable: true })
  @IsOptional() @EmptyToNull() @IsString() @Matches(SKU_RULE, { message: SKU_MESSAGE })
  sku?: string | null;

  @ApiProperty({ example: 1299 })
  @IsNumber(MONEY, { message: 'Price must be a number with at most 2 decimals' }) @Min(0.01, { message: 'Price must be greater than 0' }) @Max(10_000_000)
  price: number;

  @ApiPropertyOptional({ example: 999, nullable: true })
  @IsOptional() @IsNumber(MONEY, { message: 'Sale price must be a number with at most 2 decimals' }) @Min(0.01) @Max(10_000_000)
  salePrice?: number | null;

  @ApiPropertyOptional({ example: 25, description: 'Ignored for products with variants' })
  @IsOptional() @IsInt({ message: 'Stock must be a whole number' }) @Min(0, { message: 'Stock cannot be negative' }) @Max(1_000_000)
  stock?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional() @IsInt() @Min(0) @Max(100_000)
  lowStockThreshold?: number;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(100_000)
  sortOrder?: number;

  @ApiPropertyOptional() @IsOptional() @EmptyToNull() @IsString() @MaxLength(70)
  seoTitle?: string | null;

  @ApiPropertyOptional() @IsOptional() @EmptyToNull() @IsString() @MaxLength(170)
  seoDescription?: string | null;

  @ApiPropertyOptional({ type: [SpecificationInputDto] })
  @IsOptional() @IsArray() @ArrayMaxSize(40) @ValidateNested({ each: true }) @Type(() => SpecificationInputDto)
  specifications?: SpecificationInputDto[];

  @ApiPropertyOptional({ type: [ProductImageInputDto], description: 'Full ordered list; first image is the thumbnail' })
  @IsOptional() @IsArray() @ArrayMaxSize(15) @ValidateNested({ each: true }) @Type(() => ProductImageInputDto)
  images?: ProductImageInputDto[];

  @ApiPropertyOptional({ type: [ProductOptionInputDto], description: 'Option groups. [] removes variants.' })
  @IsOptional() @IsArray() @ArrayMaxSize(5) @ValidateNested({ each: true }) @Type(() => ProductOptionInputDto)
  options?: ProductOptionInputDto[];

  @ApiPropertyOptional({ type: [ProductVariantInputDto], description: 'Required when options are given' })
  @IsOptional() @IsArray() @ArrayMaxSize(250) @ValidateNested({ each: true }) @Type(() => ProductVariantInputDto)
  variants?: ProductVariantInputDto[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class ProductStatusDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isFeatured?: boolean;
}

export class BulkProductActionDto {
  @ApiProperty({ type: [String] })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(200) @IsString({ each: true })
  ids: string[];

  @ApiProperty({ enum: ['activate', 'deactivate', 'feature', 'unfeature', 'delete'] })
  @IsIn(['activate', 'deactivate', 'feature', 'unfeature', 'delete'])
  action: 'activate' | 'deactivate' | 'feature' | 'unfeature' | 'delete';
}
