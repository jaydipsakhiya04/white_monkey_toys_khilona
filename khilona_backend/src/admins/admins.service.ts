import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { BCRYPT_ROUNDS, toAdminProfile } from './admin.mapper';
import { CreateAdminDto, UpdateAdminDto } from './dto/admin.dto';

@Injectable()
export class AdminsService {
  private readonly logger = new Logger('Admins');

  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const admins = await this.prisma.admin.findMany({ orderBy: [{ role: 'asc' }, { createdAt: 'asc' }] });
    return admins.map(toAdminProfile);
  }

  async create(dto: CreateAdminDto, actorEmail: string) {
    const exists = await this.prisma.admin.findUnique({ where: { email: dto.email } });
    if (exists) {
      throw new ConflictException({
        message: 'An admin with this email already exists',
        errors: [{ field: 'email', message: 'An admin with this email already exists' }],
      });
    }
    const admin = await this.prisma.admin.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone ?? null,
        role: dto.role,
        passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
      },
    });
    this.logger.log(`${actorEmail} created admin ${admin.email} (${admin.role})`);
    return toAdminProfile(admin);
  }

  async update(id: string, dto: UpdateAdminDto, actorId: string, actorEmail: string) {
    const admin = await this.prisma.admin.findUnique({ where: { id } });
    if (!admin) throw new NotFoundException('Admin not found');

    if (id === actorId && (dto.isActive === false || (dto.role && dto.role !== admin.role))) {
      throw new BadRequestException('You cannot deactivate or change the role of your own account');
    }

    const data: Prisma.AdminUpdateInput = {
      name: dto.name,
      phone: dto.phone,
      role: dto.role,
      isActive: dto.isActive,
    };
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.admin.update({ where: { id }, data });
      // Deactivation or password reset ends all sessions.
      if (dto.isActive === false || dto.password) {
        await tx.adminRefreshToken.updateMany({ where: { adminId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      }
      return result;
    });
    this.logger.log(`${actorEmail} updated admin ${updated.email}`);
    return toAdminProfile(updated);
  }
}
