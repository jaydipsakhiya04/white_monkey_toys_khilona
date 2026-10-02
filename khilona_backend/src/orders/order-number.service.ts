import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { compactDateInZone } from '../common/utils/time';
import { APP_CONFIG, AppConfig } from '../config/configuration';

/**
 * Generates human friendly order numbers: WMT-20261002-0001.
 *
 * The sequence comes from an atomic `INSERT … ON CONFLICT DO UPDATE … RETURNING` on a per-day
 * counter row inside the order transaction, so concurrent orders can never receive the same
 * number (the row lock serialises increments). The unique index on Order.orderNumber is a
 * final safety net. Numbers grow past 9999 naturally (WMT-20261002-10000).
 */
@Injectable()
export class OrderNumberService {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async next(tx: Prisma.TransactionClient, now = new Date()): Promise<string> {
    const day = compactDateInZone(now, this.config.timezone);
    const rows = await tx.$queryRaw<{ value: number }[]>`
      INSERT INTO "OrderCounter" ("day", "value") VALUES (${day}, 1)
      ON CONFLICT ("day") DO UPDATE SET "value" = "OrderCounter"."value" + 1
      RETURNING "value"`;
    const seq = Number(rows[0].value);
    return `${this.config.orderNumberPrefix}-${day}-${String(seq).padStart(4, '0')}`;
  }
}
