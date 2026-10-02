import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

type LogOptions = { log: [{ emit: 'event'; level: 'warn' }, { emit: 'event'; level: 'error' }] };

@Injectable()
export class PrismaService
  extends PrismaClient<LogOptions, Prisma.LogLevel>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger('Database');

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    this.$on('warn', (e) => this.logger.warn(e.message));
    this.$on('error', (e) => this.logger.error(e.message));
    await this.$connect();
    this.logger.log('Connected to PostgreSQL');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
