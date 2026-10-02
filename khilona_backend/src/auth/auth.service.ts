import { BadRequestException, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Admin } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { AdminProfile, BCRYPT_ROUNDS, toAdminProfile } from '../admins/admin.mapper';
import { APP_CONFIG, AppConfig } from '../config/configuration';
import { PrismaService } from '../database/prisma.service';
import { ChangePasswordDto, UpdateProfileDto } from './dto/auth.dto';

export interface ClientMeta {
  ip?: string;
  userAgent?: string;
}

export interface AuthResult {
  accessToken: string;
  expiresIn: number;
  admin: AdminProfile;
  refreshToken: string;
  refreshExpiresAt: Date;
}

// Used to keep login timing similar whether or not the email exists.
const DUMMY_HASH = bcrypt.hashSync(randomBytes(16).toString('hex'), BCRYPT_ROUNDS);

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class AuthService {
  private readonly logger = new Logger('Auth');

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async login(email: string, password: string, meta: ClientMeta): Promise<AuthResult> {
    const admin = await this.prisma.admin.findUnique({ where: { email: email.toLowerCase() } });
    const valid = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);

    if (!admin || !valid) {
      this.logger.warn(`Failed login attempt for "${email}" from ${meta.ip ?? 'unknown'}`);
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!admin.isActive) {
      this.logger.warn(`Login attempt for deactivated admin "${email}"`);
      throw new UnauthorizedException('This account has been deactivated. Contact the store owner.');
    }

    const updated = await this.prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
    this.logger.log(`Admin ${admin.email} signed in`);
    return this.issueTokens(updated, meta);
  }

  /** Rotates the refresh token. Reuse of a revoked token revokes every session of that admin. */
  async refresh(rawToken: string | undefined, meta: ClientMeta): Promise<AuthResult> {
    if (!rawToken) throw new UnauthorizedException('Session expired');
    const record = await this.prisma.adminRefreshToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
      include: { admin: true },
    });
    if (!record) throw new UnauthorizedException('Session expired');

    if (record.revokedAt) {
      this.logger.warn(`Refresh token reuse detected for admin ${record.admin.email}; revoking all sessions`);
      await this.prisma.adminRefreshToken.updateMany({
        where: { adminId: record.adminId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Session expired');
    }
    if (record.expiresAt < new Date() || !record.admin.isActive) {
      throw new UnauthorizedException('Session expired');
    }

    // Revoke conditionally so two concurrent refreshes cannot both succeed.
    const revoked = await this.prisma.adminRefreshToken.updateMany({
      where: { id: record.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (revoked.count === 0) throw new UnauthorizedException('Session expired');

    return this.issueTokens(record.admin, meta);
  }

  async logout(rawToken: string | undefined) {
    if (!rawToken) return;
    await this.prisma.adminRefreshToken.updateMany({
      where: { tokenHash: hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(adminId: string): Promise<AdminProfile> {
    const admin = await this.prisma.admin.findUniqueOrThrow({ where: { id: adminId } });
    return toAdminProfile(admin);
  }

  async updateProfile(adminId: string, dto: UpdateProfileDto): Promise<AdminProfile> {
    const admin = await this.prisma.admin.update({
      where: { id: adminId },
      data: { name: dto.name, phone: dto.phone },
    });
    return toAdminProfile(admin);
  }

  async changePassword(adminId: string, dto: ChangePasswordDto, currentRefreshToken?: string) {
    const admin = await this.prisma.admin.findUniqueOrThrow({ where: { id: adminId } });
    const valid = await bcrypt.compare(dto.currentPassword, admin.passwordHash);
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
      this.prisma.admin.update({ where: { id: adminId }, data: { passwordHash } }),
      this.prisma.adminRefreshToken.updateMany({
        where: { adminId, revokedAt: null, ...(keepHash ? { NOT: { tokenHash: keepHash } } : {}) },
        data: { revokedAt: new Date() },
      }),
    ]);
    this.logger.log(`Admin ${admin.email} changed their password`);
  }

  private async issueTokens(admin: Admin, meta: ClientMeta): Promise<AuthResult> {
    const accessToken = await this.jwt.signAsync({ sub: admin.id, role: admin.role, type: 'access' });
    const refreshToken = randomBytes(48).toString('base64url');
    const refreshExpiresAt = new Date(Date.now() + this.config.jwt.refreshTtlDays * 86400_000);

    await this.prisma.adminRefreshToken.create({
      data: {
        adminId: admin.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: refreshExpiresAt,
        ipAddress: meta.ip?.slice(0, 64),
        userAgent: meta.userAgent?.slice(0, 255),
      },
    });

    // Opportunistic cleanup of long-expired tokens for this admin.
    await this.prisma.adminRefreshToken.deleteMany({
      where: { adminId: admin.id, expiresAt: { lt: new Date(Date.now() - 86400_000) } },
    });

    return {
      accessToken,
      expiresIn: this.config.jwt.expiresInSeconds,
      admin: toAdminProfile(admin),
      refreshToken,
      refreshExpiresAt,
    };
  }
}
