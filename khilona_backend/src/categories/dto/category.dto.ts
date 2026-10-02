import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
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
import { EmptyToNull, EmptyToUndefined, ToBoolean } from '../../common/decorators/transforms';

const URL_OPTS = { protocols: ['http', 'https'], require_protocol: true, require_tld: false };

export class CreateCategoryDto {
  @ApiProperty({ example: 'Remote Control Toys' })
  @IsString()
  @Length(2, 80, { message: 'Name must be 2–80 characters' })
  name: string;

  @ApiPropertyOptional({ example: 'remote-control-toys', description: 'Auto-generated from name when omitted' })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Slug may only contain lowercase letters, numbers and hyphens' })
  @MaxLength(90)
  slug?: string;

  @ApiPropertyOptional({ example: 'Cars, drones and more that zoom.' })
  @IsOptional() @EmptyToNull() @IsString() @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ example: 'http://localhost:4000/uploads/categories/2026/10/abc.webp' })
  @IsOptional() @EmptyToNull() @IsUrl(URL_OPTS, { message: 'Image must be a valid URL' }) @MaxLength(500)
  imageUrl?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional() @IsInt() @Min(0) @Max(100000)
  sortOrder?: number;

  @ApiPropertyOptional({ nullable: true, description: 'Parent category id (max 2 levels)' })
  @IsOptional() @EmptyToNull() @IsString()
  parentId?: string | null;

  @ApiPropertyOptional() @IsOptional() @EmptyToNull() @IsString() @MaxLength(70)
  seoTitle?: string | null;

  @ApiPropertyOptional() @IsOptional() @EmptyToNull() @IsString() @MaxLength(170)
  seoDescription?: string | null;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class AdminCategoryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional() @EmptyToUndefined() @IsString() @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @IsOptional() @EmptyToUndefined() @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @ApiPropertyOptional({ description: 'Parent id, or "root" for top-level categories' })
  @IsOptional() @EmptyToUndefined() @IsString()
  parentId?: string;

  @ApiPropertyOptional({ enum: ['sortOrder', 'name', 'newest', 'products'], default: 'sortOrder' })
  @IsOptional() @EmptyToUndefined() @IsIn(['sortOrder', 'name', 'newest', 'products'])
  sort?: 'sortOrder' | 'name' | 'newest' | 'products';
}

export class PublicCategoryQueryDto {
  @ApiPropertyOptional({ description: 'Return a flat list instead of a tree' })
  @IsOptional() @ToBoolean() @IsBoolean()
  flat?: boolean;
}

class ReorderItemDto {
  @ApiProperty() @IsString()
  id: string;

  @ApiProperty() @IsInt() @Min(0) @Max(100000)
  sortOrder: number;
}

export class ReorderCategoriesDto {
  @ApiProperty({ type: [ReorderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}

export class DeleteCategoryQueryDto {
  @ApiPropertyOptional({ description: 'Move this category’s products to another category before deleting' })
  @IsOptional() @EmptyToUndefined() @IsString()
  moveProductsTo?: string;
}
