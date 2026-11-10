import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { EmptyToNull } from '../../common/decorators/transforms';

const URL_OPTS = { protocols: ['http', 'https'], require_protocol: true, require_tld: false };
/** A storefront path ("/category/drones-and-rc-aircraft?sort=newest") or a full http(s) URL. */
const LINK = /^(\/\S*|https?:\/\/\S+)$/;

export class CreateBannerDto {
  @ApiPropertyOptional({ example: 'Diwali RC Mega Sale', nullable: true })
  @IsOptional() @EmptyToNull() @IsString() @MaxLength(80)
  title?: string | null;

  @ApiPropertyOptional({ example: 'Up to 30% off on hobby-grade RC cars', nullable: true })
  @IsOptional() @EmptyToNull() @IsString() @MaxLength(160)
  subtitle?: string | null;

  @ApiProperty({ example: 'http://localhost:4000/uploads/banners/2026/11/abc.webp' })
  @IsUrl(URL_OPTS, { message: 'Upload a banner image' })
  @MaxLength(500)
  imageUrl: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional() @EmptyToNull() @IsUrl(URL_OPTS, { message: 'Mobile image must be a valid URL' }) @MaxLength(500)
  mobileImageUrl?: string | null;

  @ApiPropertyOptional({ example: '/category/hobby-grade-rc-cars', nullable: true })
  @IsOptional() @EmptyToNull() @IsString() @MaxLength(500)
  @Matches(LINK, { message: 'Link must be a store path like /products or a full https:// URL' })
  linkUrl?: string | null;

  @ApiPropertyOptional({ example: 'Shop the sale', nullable: true })
  @IsOptional() @EmptyToNull() @IsString() @MaxLength(30)
  ctaLabel?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional() @IsInt() @Min(0) @Max(10_000)
  sortOrder?: number;

  @ApiPropertyOptional({ nullable: true, example: '2026-11-01T00:00:00.000Z' })
  @IsOptional() @EmptyToNull() @Type(() => Date) @IsDate({ message: 'Start date is invalid' })
  startsAt?: Date | null;

  @ApiPropertyOptional({ nullable: true, example: '2026-11-15T23:59:59.000Z' })
  @IsOptional() @EmptyToNull() @Type(() => Date) @IsDate({ message: 'End date is invalid' })
  endsAt?: Date | null;
}

export class UpdateBannerDto extends PartialType(CreateBannerDto) {}

export class ReorderBannersDto {
  @ApiProperty({ type: [String], description: 'Banner ids in display order' })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100) @IsString({ each: true })
  ids: string[];
}
