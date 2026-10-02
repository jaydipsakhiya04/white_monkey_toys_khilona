import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { PASSWORD_MESSAGE, PASSWORD_RULE } from '../../auth/dto/auth.dto';
import { EmptyToNull, ToLowerTrim } from '../../common/decorators/transforms';

export class CreateAdminDto {
  @ApiProperty({ example: 'Priya Sharma' })
  @IsString()
  @Length(2, 80)
  name: string;

  @ApiProperty({ example: 'priya@khilona.in' })
  @ToLowerTrim()
  @IsEmail({}, { message: 'Enter a valid email address' })
  @MaxLength(160)
  email: string;

  @ApiProperty({ example: 'Welcome123' })
  @IsString()
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  password: string;

  @ApiPropertyOptional({ example: '9876543210', nullable: true })
  @IsOptional()
  @EmptyToNull()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @ApiProperty({ enum: AdminRole, example: AdminRole.ADMIN })
  @IsEnum(AdminRole)
  role: AdminRole;
}

export class UpdateAdminDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 80)
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @EmptyToNull()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @ApiPropertyOptional({ enum: AdminRole })
  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Reset password' })
  @IsOptional()
  @IsString()
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  password?: string;
}
