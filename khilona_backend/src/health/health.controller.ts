import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { PrismaService } from '../database/prisma.service';

@ApiTags('Health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ResponseMessage('OK')
  @ApiOperation({ summary: 'Liveness + database connectivity' })
  async check() {
    let database: 'up' | 'down' = 'up';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'down';
    }
    return { status: 'ok', database, uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() };
  }
}
