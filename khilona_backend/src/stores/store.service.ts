import { Inject, Injectable, Logger } from '@nestjs/common';
import { Store } from '@prisma/client';
import { APP_CONFIG, AppConfig } from '../config/configuration';
import { PrismaService } from '../database/prisma.service';
import { telUrl, whatsappUrl } from '../common/utils/phone';
import { hhmmToMinutes, minutesOfDayInZone } from '../common/utils/time';
import { UpdateStoreDto } from './dto/update-store.dto';

/**
 * The store is a single configuration row. It is created on first access so the
 * application always has a valid store, even before seeding.
 */
@Injectable()
export class StoreService {
  private readonly logger = new Logger('Store');

  constructor(
    private readonly prisma: PrismaService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async get(): Promise<Store> {
    const store = await this.prisma.store.findFirst({ orderBy: { createdAt: 'asc' } });
    if (store) return store;
    return this.prisma.store.create({ data: { name: 'Khilona' } });
  }

  async getPublic() {
    const store = await this.get();
    return {
      ...store,
      isOpenNow: this.isOpenNow(store),
      whatsappUrl: whatsappUrl(store.whatsapp),
      phoneUrl: telUrl(store.phone),
    };
  }

  async update(dto: UpdateStoreDto, actorEmail: string): Promise<Store> {
    const store = await this.get();
    const updated = await this.prisma.store.update({ where: { id: store.id }, data: dto });
    this.logger.log(`${actorEmail} updated store settings (${Object.keys(dto).join(', ') || 'no fields'})`);
    return updated;
  }

  /** Open when the master switch is on and the current local time is within opening hours. */
  isOpenNow(store: Pick<Store, 'isOpen' | 'openingTime' | 'closingTime'>, now = new Date()): boolean {
    if (!store.isOpen) return false;
    const open = hhmmToMinutes(store.openingTime);
    const close = hhmmToMinutes(store.closingTime);
    if (open === null || close === null || open === close) return true;
    const current = minutesOfDayInZone(now, this.config.timezone);
    // Supports overnight hours (e.g. 18:00 – 02:00).
    return open < close ? current >= open && current < close : current >= open || current < close;
  }
}
