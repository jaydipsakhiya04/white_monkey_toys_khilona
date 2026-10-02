import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { EmptyToNull, EmptyToUndefined, ToInt } from '../../common/decorators/transforms';

export class CreateReviewDto {
  @ApiProperty({ example: 'WMT-20261002-0012', description: 'The delivered order the product was bought in' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @Length(5, 40)
  orderNumber: string;

  @ApiProperty({ example: 'clx0prod0001' })
  @IsString()
  @Length(1, 40)
  productId: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt({ message: 'Please choose a rating from 1 to 5 stars' })
  @Min(1, { message: 'Please choose a rating from 1 to 5 stars' })
  @Max(5, { message: 'Please choose a rating from 1 to 5 stars' })
  rating: number;

  @ApiPropertyOptional({ example: 'My son loves it — sturdy and the battery lasts long.', nullable: true })
  @IsOptional()
  @EmptyToNull()
  @IsString()
  @MaxLength(2000, { message: 'Review must be at most 2000 characters' })
  comment?: string | null;
}

export class UpdateReviewDto {
  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt({ message: 'Please choose a rating from 1 to 5 stars' })
  @Min(1, { message: 'Please choose a rating from 1 to 5 stars' })
  @Max(5, { message: 'Please choose a rating from 1 to 5 stars' })
  rating?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @EmptyToNull()
  @IsString()
  @MaxLength(2000, { message: 'Review must be at most 2000 characters' })
  comment?: string | null;
}

export class PublicReviewQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 5, description: 'Only reviews with this star rating' })
  @IsOptional()
  @ToInt()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}

export class AdminReviewQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ReviewStatus })
  @IsOptional()
  @EmptyToUndefined()
  @IsIn(Object.values(ReviewStatus))
  status?: ReviewStatus;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @ToInt()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Product name, customer name, order number or review text' })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class AdminReviewStatusDto {
  @ApiProperty({ enum: [ReviewStatus.APPROVED, ReviewStatus.HIDDEN], description: 'Admins can publish or hide a review, never edit it' })
  @IsIn([ReviewStatus.APPROVED, ReviewStatus.HIDDEN], { message: 'Status must be APPROVED or HIDDEN' })
  status: 'APPROVED' | 'HIDDEN';
}
