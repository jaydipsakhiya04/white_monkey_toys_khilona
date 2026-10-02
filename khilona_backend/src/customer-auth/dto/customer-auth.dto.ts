import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_MESSAGE, PASSWORD_RULE } from '../../auth/dto/auth.dto';
import { EmptyToUndefined, INDIAN_MOBILE, NormalizePhone, ToLowerTrim } from '../../common/decorators/transforms';

export class CustomerSignupDto {
  @ApiProperty({ example: 'Jaydip Patel' })
  @IsString()
  @Length(2, 80, { message: 'Name must be 2–80 characters' })
  name: string;

  @ApiProperty({ example: 'jaydip@example.com' })
  @ToLowerTrim()
  @IsEmail({}, { message: 'Enter a valid email address' })
  @MaxLength(160)
  email: string;

  @ApiProperty({ example: '+91 98765 43210', description: 'Indian mobile number; normalised to 10 digits' })
  @NormalizePhone()
  @IsString({ message: 'Mobile number is required' })
  @Matches(INDIAN_MOBILE, { message: 'Enter a valid 10-digit Indian mobile number' })
  phone: string;

  @ApiProperty({ example: 'Toys2026!' })
  @IsString()
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  password: string;
}

export class CustomerLoginDto {
  @ApiProperty({ example: 'jaydip@example.com', description: 'Email address or 10-digit mobile number' })
  @IsString()
  @MinLength(1, { message: 'Enter your email or mobile number' })
  @MaxLength(160)
  identifier: string;

  @ApiProperty({ example: 'Toys2026!' })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  @MaxLength(128)
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'jaydip@example.com', description: 'Email address or 10-digit mobile number' })
  @IsString()
  @MinLength(1, { message: 'Enter your email or mobile number' })
  @MaxLength(160)
  identifier: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token from the password reset link' })
  @IsString()
  @Length(20, 200, { message: 'This reset link is invalid' })
  token: string;

  @ApiProperty({ example: 'NewToys2026!' })
  @IsString()
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  password: string;
}

export class UpdateCustomerProfileDto {
  @ApiPropertyOptional({ example: 'Jaydip Patel' })
  @IsOptional()
  @IsString()
  @Length(2, 80, { message: 'Name must be 2–80 characters' })
  name?: string;

  @ApiPropertyOptional({ example: 'jaydip@example.com' })
  @IsOptional()
  @EmptyToUndefined()
  @ToLowerTrim()
  @IsEmail({}, { message: 'Enter a valid email address' })
  @MaxLength(160)
  email?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @NormalizePhone()
  @IsString()
  @Matches(INDIAN_MOBILE, { message: 'Enter a valid 10-digit Indian mobile number' })
  phone?: string;
}

export class ChangeCustomerPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Current password is required' })
  currentPassword: string;

  @ApiProperty({ example: 'NewToys2026!' })
  @IsString()
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  newPassword: string;
}
