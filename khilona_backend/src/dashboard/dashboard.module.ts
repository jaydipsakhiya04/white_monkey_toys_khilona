import { Controller, Get, Module } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuth } from '../common/decorators/auth.decorators';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Admin · Dashboard')
@Controller('admin/dashboard')
@AdminAuth()
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @ResponseMessage('Dashboard fetched')
  @ApiOperation({ summary: 'Order, product and category statistics + recent activity' })
  overview() {
    return this.dashboard.overview();
  }
}

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
