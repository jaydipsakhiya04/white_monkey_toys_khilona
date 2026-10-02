import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { EmptyToUndefined } from '../../common/decorators/transforms';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class CustomerOrderQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['active', 'delivered', 'cancelled'] })
  @IsOptional()
  @EmptyToUndefined()
  @IsIn(['active', 'delivered', 'cancelled'])
  status?: 'active' | 'delivered' | 'cancelled';
}

export class ClaimOrderDto {
  @ApiProperty({ example: 'WMT-20261002-0001', description: 'An order placed as a guest with your account mobile number' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @Length(5, 40, { message: 'Enter a valid order number' })
  orderNumber: string;
}

export class CancelOrderDto {
  @ApiPropertyOptional({ example: 'Ordered by mistake' })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
