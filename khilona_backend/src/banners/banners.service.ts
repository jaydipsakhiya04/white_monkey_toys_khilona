import { Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Banner, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';

export type BannerState = 'LIVE' | 'SCHEDULED' | 'EXPIRED' | 'HIDDEN';

/** Offer / promotion slides shown in the home page slider, managed from the admin panel. */
@Injectable()
export class BannersService {
  private readonly logger = new Logger('Banners');

  constructor(private readonly prisma: PrismaService) {}

  /** Active slides inside their schedule, in display order. */
  async listPublic() {
    const now = new Date();
    const rows = await this.prisma.banner.findMany({
      where: {
        isActive: true,
        AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 12,
    });
    return rows.map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      imageUrl: b.imageUrl,
      mobileImageUrl: b.mobileImageUrl,
      linkUrl: b.linkUrl,
      ctaLabel: b.ctaLabel,
    }));
  }

  async listAdmin() {
    const rows = await this.prisma.banner.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
    return rows.map((b) => this.toAdmin(b));
  }

  async create(dto: CreateBannerDto, actorEmail: string) {
    this.assertSchedule(dto.startsAt ?? null, dto.endsAt ?? null);
    const last = await this.prisma.banner.aggregate({ _max: { sortOrder: true } });
    const data: Prisma.BannerCreateInput = { ...dto, sortOrder: dto.sortOrder ?? (last._max.sortOrder ?? -1) + 1 };
    const banner = await this.prisma.banner.create({ data });
    this.logger.log(`${actorEmail} created banner ${banner.id}`);
    return this.toAdmin(banner);
  }

  async update(id: string, dto: UpdateBannerDto, actorEmail: string) {
    const existing = await this.find(id);
    this.assertSchedule(dto.startsAt !== undefined ? dto.startsAt : existing.startsAt, dto.endsAt !== undefined ? dto.endsAt : existing.endsAt);
    const banner = await this.prisma.banner.update({ where: { id }, data: dto as Prisma.BannerUpdateInput });
    this.logger.log(`${actorEmail} updated banner ${id} (${Object.keys(dto).join(', ')})`);
    return this.toAdmin(banner);
  }

  async remove(id: string, actorEmail: string) {
    await this.find(id);
    await this.prisma.banner.delete({ where: { id } });
    this.logger.log(`${actorEmail} deleted banner ${id}`);
    return { id };
  }

  async reorder(ids: string[], actorEmail: string) {
    await this.prisma.$transaction(ids.map((id, sortOrder) => this.prisma.banner.updateMany({ where: { id }, data: { sortOrder } })));
    this.logger.log(`${actorEmail} reordered ${ids.length} banners`);
    return this.listAdmin();
  }

  private async find(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');
    return banner;
  }

  private assertSchedule(startsAt: Date | null | undefined, endsAt: Date | null | undefined) {
    if (startsAt && endsAt && endsAt <= startsAt) {
      throw new UnprocessableEntityException({
        message: 'The end date must be after the start date',
        errors: [{ field: 'endsAt', message: 'Must be after the start date' }],
      });
    }
  }

  private state(b: Banner, now = new Date()): BannerState {
    if (!b.isActive) return 'HIDDEN';
    if (b.startsAt && b.startsAt > now) return 'SCHEDULED';
    if (b.endsAt && b.endsAt <= now) return 'EXPIRED';
    return 'LIVE';
  }

  private toAdmin(b: Banner) {
    return { ...b, state: this.state(b) };
  }
}
