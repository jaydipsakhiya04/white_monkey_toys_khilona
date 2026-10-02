import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';
import { EmptyToNull, ToLowerTrim } from '../../common/decorators/transforms';

export const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
export const PASSWORD_MESSAGE = 'Password must be 8–72 characters and include at least one letter and one number';

export class LoginDto {
  @ApiProperty({ example: 'admin@khilona.in' })
  @ToLowerTrim()
  @IsEmail({}, { message: 'Enter a valid email address' })
  @MaxLength(160)
  email: string;

  @ApiProperty({ example: 'Admin@12345' })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  @MaxLength(128)
  password: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Store Owner' })
  @IsOptional()
  @IsString()
  @Length(2, 80, { message: 'Name must be 2–80 characters' })
  name?: string;

  @ApiPropertyOptional({ example: '9876543210', nullable: true })
  @IsOptional()
  @EmptyToNull()
  @IsString()
  @MaxLength(20)
  phone?: string | null;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Current password is required' })
  currentPassword: string;

  @ApiProperty({ example: 'NewPassw0rd' })
  @IsString()
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  newPassword: string;
}
