import { BadRequestException, ConflictException, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Customer, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { BCRYPT_ROUNDS } from '../admins/admin.mapper';
import { FieldError } from '../common/filters/all-exceptions.filter';
import { CUSTOMER_AUDIENCE } from '../common/guards/customer-auth.guard';
import { normalizeIndianMobile } from '../common/utils/phone';
import { APP_CONFIG, AppConfig } from '../config/configuration';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CustomerProfile, toCustomerProfile } from './customer.mapper';
import { ChangeCustomerPasswordDto, CustomerSignupDto, ResetPasswordDto } from './dto/customer-auth.dto';

export interface ClientMeta {
  ip?: string;
  userAgent?: string;
}

export interface CustomerAuthResult {
  accessToken: string;
  expiresIn: number;
  customer: CustomerProfile;
  refreshToken: string;
  refreshExpiresAt: Date;
}

// Keeps login timing similar whether or not the account exists.
const DUMMY_HASH = bcrypt.hashSync(randomBytes(16).toString('hex'), BCRYPT_ROUNDS);
const INVALID_CREDENTIALS = 'Email/mobile or password is incorrect';

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class CustomerAuthService {
  private readonly logger = new Logger('CustomerAuth');

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly notifications: NotificationsService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  /**
   * Creates an account. A guest customer record with the same mobile (from earlier guest
   * checkouts) is upgraded in place, but its past orders are NOT linked to the account: the
   * mobile number is not verified, so those orders stay private until claimed with the order
   * number (see AccountService.claimOrder).
   */
  async signup(dto: CustomerSignupDto, meta: ClientMeta): Promise<CustomerAuthResult> {
    const [byEmail, byPhone] = await Promise.all([
      this.prisma.customer.findUnique({ where: { accountEmail: dto.email } }),
      this.prisma.customer.findUnique({ where: { phone: dto.phone } }),
    ]);
    const errors: FieldError[] = [];
    if (byEmail) errors.push({ field: 'email', message: 'An account with this email already exists' });
    if (byPhone?.passwordHash) errors.push({ field: 'phone', message: 'An account with this mobile number already exists' });
    if (errors.length) throw new ConflictException({ message: errors[0].message, errors });

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const now = new Date();
    const data = {
      name: dto.name,
      email: dto.email,
      accountEmail: dto.email,
      passwordHash,
      registeredAt: now,
      lastLoginAt: now,
      isActive: true,
    };

    let customer: Customer;
    try {
      customer = byPhone
        ? await this.prisma.customer.update({ where: { id: byPhone.id, passwordHash: null }, data })
        : await this.prisma.customer.create({ data: { ...data, phone: dto.phone } });
    } catch (err) {
      // Lost a race with a concurrent signup for the same email / mobile.
      if (err instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2025'].includes(err.code)) {
        throw new ConflictException({
          message: 'An account with these details already exists',
          errors: [{ field: 'email', message: 'An account with these details already exists' }],
        });
      }
      throw err;
    }

    this.logger.log(`Customer account created (${customer.id})${byPhone ? ' from an existing guest record' : ''}`);
    return this.issueTokens(customer, meta);
  }

  async login(identifier: string, password: string, meta: ClientMeta): Promise<CustomerAuthResult> {
    const customer = await this.findAccount(identifier);
    const valid = await bcrypt.compare(password, customer?.passwordHash ?? DUMMY_HASH);
    if (!customer || !customer.passwordHash || !valid) {
      this.logger.warn(`Failed customer login from ${meta.ip ?? 'unknown'}`);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    if (!customer.isActive) throw new UnauthorizedException('This account has been deactivated. Please contact the store.');

    const updated = await this.prisma.customer.update({ where: { id: customer.id }, data: { lastLoginAt: new Date() } });
    return this.issueTokens(updated, meta);
  }

  /** Rotates the refresh token. Reuse of a revoked token revokes every session of that customer. */
  async refresh(rawToken: string | undefined, meta: ClientMeta): Promise<CustomerAuthResult> {
    if (!rawToken) throw new UnauthorizedException('Session expired');
    const record = await this.prisma.customerRefreshToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
      include: { customer: true },
    });
    if (!record) throw new UnauthorizedException('Session expired');

    if (record.revokedAt) {
      this.logger.warn(`Refresh token reuse detected for customer ${record.customerId}; revoking all sessions`);
      await this.prisma.customerRefreshToken.updateMany({
        where: { customerId: record.customerId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Session expired');
    }
    if (record.expiresAt < new Date() || !record.customer.isActive || !record.customer.passwordHash) {
      throw new UnauthorizedException('Session expired');
    }

    const revoked = await this.prisma.customerRefreshToken.updateMany({
      where: { id: record.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (revoked.count === 0) throw new UnauthorizedException('Session expired');

    return this.issueTokens(record.customer, meta);
  }

  async logout(rawToken: string | undefined) {
    if (!rawToken) return;
    await this.prisma.customerRefreshToken.updateMany({
      where: { tokenHash: hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Starts a password reset. The response never reveals whether an account exists; it only says
   * whether this installation can deliver reset links at all (no channel => the storefront tells
   * the customer to contact the store instead of pretending an email was sent).
   */
  async requestPasswordReset(identifier: string, meta: ClientMeta): Promise<{ deliveryAvailable: boolean }> {
    const deliveryAvailable = this.notifications.canDeliverPasswordResets();
    const customer = await this.findAccount(identifier);
    if (!customer?.passwordHash || !customer.isActive) return { deliveryAvailable };

    // Basic abuse guard: at most 3 links per account per hour.
    const recent = await this.prisma.customerPasswordReset.count({
      where: { customerId: customer.id, createdAt: { gt: new Date(Date.now() - 3600_000) } },
    });
    if (recent >= 3) return { deliveryAvailable };

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + this.config.jwt.passwordResetTtlMinutes * 60_000);
    await this.prisma.$transaction([
      // Only the newest link works.
      this.prisma.customerPasswordReset.updateMany({
        where: { customerId: customer.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.customerPasswordReset.create({
        data: { customerId: customer.id, tokenHash: hashToken(token), expiresAt, ipAddress: meta.ip?.slice(0, 64) },
      }),
    ]);

    this.notifications.passwordResetRequested({
      customerId: customer.id,
      name: customer.name,
      email: customer.accountEmail,
      phone: customer.phone,
      resetUrl: `${this.config.storefrontUrl}/reset-password?token=${encodeURIComponent(token)}`,
      expiresAt,
    });
    return { deliveryAvailable };
  }

  /** Completes a reset with a single-use token and signs out every existing session. */
  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.prisma.customerPasswordReset.findUnique({
      where: { tokenHash: hashToken(dto.token) },
      include: { customer: true },
    });
    if (!record || record.usedAt || record.expiresAt < new Date() || !record.customer.isActive) {
      throw new BadRequestException('This reset link is invalid or has expired. Please request a new one.');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const now = new Date();
    const used = await this.prisma.customerPasswordReset.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: now },
    });
    if (used.count === 0) throw new BadRequestException('This reset link has already been used.');
    await this.prisma.$transaction([
      this.prisma.customer.update({ where: { id: record.customerId }, data: { passwordHash } }),
      this.prisma.customerRefreshToken.updateMany({
        where: { customerId: record.customerId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);
    this.logger.log(`Customer ${record.customerId} reset their password`);
  }

  async changePassword(customerId: string, dto: ChangeCustomerPasswordDto, currentRefreshToken?: string) {
    const customer = await this.prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
    const valid = await bcrypt.compare(dto.currentPassword, customer.passwordHash ?? DUMMY_HASH);
    if (!valid) {
      throw new BadRequestException({
        message: 'Current password is incorrect',
        errors: [{ field: 'currentPassword', message: 'Current password is incorrect' }],
      });
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException({
        message: 'New password must be different from the current password',
        errors: [{ field: 'newPassword', message: 'New password must be different from the current password' }],
      });
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    const keepHash = currentRefreshToken ? hashToken(currentRefreshToken) : undefined;
    await this.prisma.$transaction([
      this.prisma.customer.update({ where: { id: customerId }, data: { passwordHash } }),
      this.prisma.customerRefreshToken.updateMany({
        where: { customerId, revokedAt: null, ...(keepHash ? { NOT: { tokenHash: keepHash } } : {}) },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  /** Looks up a registered account by email or mobile number. */
  private async findAccount(identifier: string): Promise<Customer | null> {
    const value = identifier.trim();
    if (value.includes('@')) {
      return this.prisma.customer.findUnique({ where: { accountEmail: value.toLowerCase() } });
    }
    const phone = normalizeIndianMobile(value);
    if (!phone) return null;
    const customer = await this.prisma.customer.findUnique({ where: { phone } });
    return customer?.passwordHash ? customer : null;
  }

  private async issueTokens(customer: Customer, meta: ClientMeta): Promise<CustomerAuthResult> {
    const accessToken = await this.jwt.signAsync({ sub: customer.id, type: 'customer' }, { audience: CUSTOMER_AUDIENCE });
    const refreshToken = randomBytes(48).toString('base64url');
    const refreshExpiresAt = new Date(Date.now() + this.config.jwt.customerRefreshTtlDays * 86400_000);

    await this.prisma.customerRefreshToken.create({
      data: {
        customerId: customer.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: refreshExpiresAt,
        ipAddress: meta.ip?.slice(0, 64),
        userAgent: meta.userAgent?.slice(0, 255),
      },
    });
    await this.prisma.customerRefreshToken.deleteMany({
      where: { customerId: customer.id, expiresAt: { lt: new Date(Date.now() - 86400_000) } },
    });

    return {
      accessToken,
      expiresIn: this.config.jwt.expiresInSeconds,
      customer: toCustomerProfile(customer),
      refreshToken,
      refreshExpiresAt,
    };
  }
}
