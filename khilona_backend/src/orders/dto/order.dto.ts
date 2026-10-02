import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
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
import { EmptyToNull, EmptyToUndefined, INDIAN_MOBILE, NormalizePhone, ToLowerTrim } from '../../common/decorators/transforms';

const URL_OPTS = { protocols: ['http', 'https'], require_protocol: true, require_tld: true };

export class CartItemDto {
  @ApiProperty({ example: 'clx0prod0001' })
  @IsString()
  @Length(1, 40)
  productId: string;

  @ApiPropertyOptional({ example: 'clx0var0001', nullable: true })
  @IsOptional()
  @EmptyToNull()
  @IsString()
  @Length(1, 40)
  variantId?: string | null;

  @ApiProperty({ example: 1, minimum: 1, maximum: 99 })
  @IsInt({ message: 'Quantity must be a whole number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(99, { message: 'Quantity cannot exceed 99' })
  quantity: number;
}

export class ValidateCartDto {
  @ApiProperty({ type: [CartItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Your cart is empty' })
  @ArrayMaxSize(50, { message: 'A cart can contain at most 50 different items' })
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];
}

export class CreateOrderDto extends ValidateCartDto {
  @ApiProperty({ example: 'Ananya Mehta' })
  @IsString()
  @Length(2, 80, { message: 'Name must be 2–80 characters' })
  customerName: string;

  @ApiProperty({ example: '+91 98765 43210', description: 'Indian mobile number; normalised to 10 digits' })
  @NormalizePhone()
  @IsString({ message: 'Mobile number is required' })
  @Matches(INDIAN_MOBILE, { message: 'Enter a valid 10-digit Indian mobile number' })
  phone: string;

  @ApiPropertyOptional({ example: '9123456780' })
  @IsOptional()
  @NormalizePhone()
  @IsString()
  @Matches(INDIAN_MOBILE, { message: 'Enter a valid 10-digit alternate mobile number' })
  alternatePhone?: string;

  @ApiPropertyOptional({ example: 'ananya@example.com' })
  @IsOptional()
  @EmptyToUndefined()
  @ToLowerTrim()
  @IsEmail({}, { message: 'Enter a valid email address' })
  @MaxLength(160)
  email?: string;

  @ApiProperty({ example: 'Flat 302, Sunrise Residency, 14 MG Road, Navrangpura' })
  @IsString()
  @Length(5, 500, { message: 'Address must be 5–500 characters' })
  address: string;

  @ApiProperty({ example: 'Ahmedabad' })
  @IsString()
  @Length(2, 60, { message: 'City must be 2–60 characters' })
  city: string;

  @ApiProperty({ example: 'Gujarat' })
  @IsString()
  @Length(2, 60, { message: 'State must be 2–60 characters' })
  state: string;

  @ApiProperty({ example: '380009' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Pincode must be 6 digits' })
  pincode: string;

  @ApiPropertyOptional({ example: 'Opposite City Gold cinema' })
  @IsOptional() @EmptyToUndefined() @IsString() @MaxLength(160)
  landmark?: string;

  @ApiPropertyOptional({ example: 'https://maps.app.goo.gl/abc123' })
  @IsOptional() @EmptyToUndefined() @IsUrl(URL_OPTS, { message: 'Enter a valid Google Maps link' }) @MaxLength(1000)
  googleMapsLink?: string;

  @ApiPropertyOptional({ example: 'https://www.google.com/maps?q=23.0225,72.5714' })
  @IsOptional() @EmptyToUndefined() @IsUrl(URL_OPTS, { message: 'Enter a valid location link' }) @MaxLength(1000)
  locationLink?: string;

  @ApiPropertyOptional({ example: 23.0225 })
  @IsOptional() @IsLatitude({ message: 'Invalid latitude' })
  latitude?: number;

  @ApiPropertyOptional({ example: 72.5714 })
  @IsOptional() @IsLongitude({ message: 'Invalid longitude' })
  longitude?: number;

  @ApiPropertyOptional({ example: 'Please call before delivery. Gift wrap if possible.' })
  @IsOptional() @EmptyToUndefined() @IsString() @MaxLength(1000)
  note?: string;
}

export class TrackOrderQueryDto {
  @ApiProperty({ example: 'WMT-20261002-0001' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @Length(5, 40)
  orderNumber: string;

  @ApiProperty({ example: '9876543210' })
  @NormalizePhone()
  @IsString()
  @Matches(INDIAN_MOBILE, { message: 'Enter the mobile number used for the order' })
  phone: string;
}

export class AdminOrderQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional() @EmptyToUndefined() @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Order number, customer name or phone' })
  @IsOptional() @EmptyToUndefined() @IsString() @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ example: '2026-10-01', description: 'YYYY-MM-DD (store timezone, inclusive)' })
  @IsOptional() @EmptyToUndefined() @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'from must be YYYY-MM-DD' })
  from?: string;

  @ApiPropertyOptional({ example: '2026-10-02', description: 'YYYY-MM-DD (store timezone, inclusive)' })
  @IsOptional() @EmptyToUndefined() @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'to must be YYYY-MM-DD' })
  to?: string;

  @ApiPropertyOptional({ enum: ['newest', 'oldest', 'total_desc', 'total_asc'], default: 'newest' })
  @IsOptional() @EmptyToUndefined() @IsIn(['newest', 'oldest', 'total_desc', 'total_asc'])
  sort?: 'newest' | 'oldest' | 'total_desc' | 'total_asc';
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.CONFIRMED })
  @IsEnum(OrderStatus, { message: 'Invalid order status' })
  status: OrderStatus;

  @ApiPropertyOptional({ example: 'Confirmed with customer on call' })
  @IsOptional() @EmptyToUndefined() @IsString() @MaxLength(500)
  note?: string;
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ nullable: true, example: 'Customer prefers evening delivery' })
  @IsOptional() @EmptyToNull() @IsString() @MaxLength(5000)
  adminNote?: string | null;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional() @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;
}
