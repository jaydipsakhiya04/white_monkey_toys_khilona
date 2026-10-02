import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, IsUrl, Length, Matches, MaxLength } from 'class-validator';
import { EmptyToNull } from '../../common/decorators/transforms';

const URL_OPTS = { protocols: ['http', 'https'], require_protocol: true, require_tld: false };
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** All fields optional: PUT /admin/store accepts any subset. Empty strings become null. */
export class UpdateStoreDto {
  @ApiPropertyOptional({ example: 'Khilona' })
  @IsOptional()
  @IsString()
  @Length(1, 80, { message: 'Store name is required (max 80 characters)' })
  name?: string;

  @ApiPropertyOptional({ example: 'Toys, games & joyful gifts' })
  @IsOptional() @EmptyToNull() @IsString() @MaxLength(140)
  tagline?: string | null;

  @ApiPropertyOptional()
  @IsOptional() @EmptyToNull() @IsString() @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional() @EmptyToNull() @IsUrl(URL_OPTS, { message: 'Logo must be a valid URL' }) @MaxLength(500)
  logoUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional() @EmptyToNull() @IsUrl(URL_OPTS, { message: 'Cover image must be a valid URL' }) @MaxLength(500)
  coverImageUrl?: string | null;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsOptional() @EmptyToNull() @IsString() @Matches(/^[+\d][\d\s-]{6,18}$/, { message: 'Enter a valid phone number' })
  phone?: string | null;

  @ApiPropertyOptional({ example: '919876543210', description: 'WhatsApp number incl. country code' })
  @IsOptional() @EmptyToNull() @IsString() @Matches(/^[+\d][\d\s-]{6,18}$/, { message: 'Enter a valid WhatsApp number' })
  whatsapp?: string | null;

  @ApiPropertyOptional({ example: 'hello@khilona.in' })
  @IsOptional() @EmptyToNull() @IsEmail({}, { message: 'Enter a valid email address' }) @MaxLength(160)
  email?: string | null;

  @ApiPropertyOptional()
  @IsOptional() @EmptyToNull() @IsString() @MaxLength(500)
  address?: string | null;

  @ApiPropertyOptional() @IsOptional() @EmptyToNull() @IsString() @MaxLength(60)
  city?: string | null;

  @ApiPropertyOptional() @IsOptional() @EmptyToNull() @IsString() @MaxLength(60)
  state?: string | null;

  @ApiPropertyOptional() @IsOptional() @EmptyToNull() @Matches(/^\d{6}$/, { message: 'Pincode must be 6 digits' })
  pincode?: string | null;

  @ApiPropertyOptional()
  @IsOptional() @EmptyToNull() @IsUrl(URL_OPTS, { message: 'Google Maps link must be a valid URL' }) @MaxLength(1000)
  googleMapLink?: string | null;

  @ApiPropertyOptional() @IsOptional() @EmptyToNull() @IsUrl(URL_OPTS, { message: 'Instagram must be a valid URL' }) @MaxLength(300)
  instagram?: string | null;

  @ApiPropertyOptional() @IsOptional() @EmptyToNull() @IsUrl(URL_OPTS, { message: 'Facebook must be a valid URL' }) @MaxLength(300)
  facebook?: string | null;

  @ApiPropertyOptional() @IsOptional() @EmptyToNull() @IsUrl(URL_OPTS, { message: 'YouTube must be a valid URL' }) @MaxLength(300)
  youtube?: string | null;

  @ApiPropertyOptional() @IsOptional() @EmptyToNull() @IsUrl(URL_OPTS, { message: 'Website must be a valid URL' }) @MaxLength(300)
  website?: string | null;

  @ApiPropertyOptional({ example: '10:00' })
  @IsOptional() @EmptyToNull() @Matches(TIME, { message: 'Opening time must be HH:mm' })
  openingTime?: string | null;

  @ApiPropertyOptional({ example: '21:00' })
  @IsOptional() @EmptyToNull() @Matches(TIME, { message: 'Closing time must be HH:mm' })
  closingTime?: string | null;

  @ApiPropertyOptional({ example: 'Monday – Sunday' })
  @IsOptional() @EmptyToNull() @IsString() @MaxLength(80)
  workingDays?: string | null;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  isOpen?: boolean;

  @ApiPropertyOptional() @IsOptional() @EmptyToNull() @IsString() @MaxLength(200)
  closedMessage?: string | null;

  @ApiPropertyOptional() @IsOptional() @EmptyToNull() @IsString() @MaxLength(120)
  heroTitle?: string | null;

  @ApiPropertyOptional() @IsOptional() @EmptyToNull() @IsString() @MaxLength(240)
  heroSubtitle?: string | null;

  @ApiPropertyOptional() @IsOptional() @EmptyToNull() @IsString() @MaxLength(40)
  heroCtaLabel?: string | null;

  @ApiPropertyOptional() @IsOptional() @EmptyToNull() @IsString() @MaxLength(200)
  announcement?: string | null;

  @ApiPropertyOptional() @IsOptional() @EmptyToNull() @IsString() @MaxLength(20000)
  shippingPolicy?: string | null;

  @ApiPropertyOptional() @IsOptional() @EmptyToNull() @IsString() @MaxLength(20000)
  returnPolicy?: string | null;

  @ApiPropertyOptional() @IsOptional() @EmptyToNull() @IsString() @MaxLength(20000)
  privacyPolicy?: string | null;

  @ApiPropertyOptional() @IsOptional() @EmptyToNull() @IsString() @MaxLength(20000)
  termsAndConditions?: string | null;

  @ApiPropertyOptional() @IsOptional() @EmptyToNull() @IsString() @MaxLength(70)
  seoTitle?: string | null;

  @ApiPropertyOptional() @IsOptional() @EmptyToNull() @IsString() @MaxLength(170)
  seoDescription?: string | null;
}
