import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiConflictResponse, ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuth, AuthenticatedAdmin, CurrentAdmin } from '../common/decorators/auth.decorators';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { AdminExchangeQueryDto, UpdateExchangeDto } from './dto/exchange.dto';
import { ExchangesService } from './exchanges.service';

@ApiTags('Admin · Exchanges')
@Controller('admin/exchanges')
@AdminAuth()
export class AdminExchangesController {
  constructor(private readonly exchanges: ExchangesService) {}

  @Get()
  @ResponseMessage('Exchange requests fetched')
  @ApiOperation({ summary: 'Search / filter / paginate exchange requests' })
  list(@Query() query: AdminExchangeQueryDto) {
    return this.exchanges.adminList(query);
  }

  @Get('status-counts')
  @ResponseMessage('Exchange counts fetched')
  @ApiOperation({ summary: 'Number of exchange requests per status (+ ALL)' })
  counts() {
    return this.exchanges.statusCounts();
  }

  @Get(':id')
  @ResponseMessage('Exchange request fetched')
  @ApiOperation({ summary: 'Exchange request details (id or request number)' })
  @ApiNotFoundResponse()
  get(@Param('id') id: string) {
    return this.exchanges.adminGet(id);
  }

  @Patch(':id')
  @ResponseMessage('Exchange request updated')
  @ApiOperation({ summary: 'Approve / reject / complete an exchange and add a note for the customer' })
  @ApiConflictResponse({ description: 'Invalid status change' })
  update(@Param('id') id: string, @Body() dto: UpdateExchangeDto, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.exchanges.adminUpdate(id, dto, admin);
  }
}
