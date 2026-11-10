import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExchangeReason, ExchangeStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Length, MaxLength, Min } from 'class-validator';
import { EmptyToNull, EmptyToUndefined } from '../../common/decorators/transforms';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

const trim = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

export class CreateExchangeDto {
  @ApiProperty({ example: 'clx0item0001', description: 'The order item to exchange (from the order details)' })
  @IsString()
  @Length(1, 40)
  orderItemId: string;

  @ApiProperty({ enum: ExchangeReason, example: ExchangeReason.DAMAGED_ITEM })
  @IsEnum(ExchangeReason, { message: 'Choose why you need an exchange' })
  reason: ExchangeReason;

  @ApiProperty({ example: 'The front wheel arrived broken and the remote does not turn on.' })
  @trim()
  @IsString({ message: 'Please describe the problem' })
  @Length(10, 1000, { message: 'Please describe the problem (10–1000 characters)' })
  details: string;

  @ApiPropertyOptional({ example: 1, description: 'Defaults to the full quantity of the item' })
  @IsOptional()
  @IsInt({ message: 'Quantity must be a whole number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity?: number;
}

export const EXCHANGE_STATUSES = Object.values(ExchangeStatus);

export class AdminExchangeQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ExchangeStatus })
  @IsOptional() @EmptyToUndefined() @IsEnum(ExchangeStatus)
  status?: ExchangeStatus;

  @ApiPropertyOptional({ description: 'Request number, order number, customer name or phone' })
  @IsOptional() @EmptyToUndefined() @IsString() @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: ['newest', 'oldest'], default: 'newest' })
  @IsOptional() @EmptyToUndefined() @IsIn(['newest', 'oldest'])
  sort?: 'newest' | 'oldest';
}

export class UpdateExchangeDto {
  @ApiPropertyOptional({ enum: ExchangeStatus })
  @IsOptional() @IsEnum(ExchangeStatus, { message: 'Invalid exchange status' })
  status?: ExchangeStatus;

  @ApiPropertyOptional({ nullable: true, example: 'Replacement dispatched with delivery partner on Monday' })
  @IsOptional() @EmptyToNull() @IsString() @MaxLength(1000)
  adminNote?: string | null;
}
