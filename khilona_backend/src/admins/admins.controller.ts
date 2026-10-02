import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { AdminAuth, AuthenticatedAdmin, CurrentAdmin } from '../common/decorators/auth.decorators';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { AdminsService } from './admins.service';
import { CreateAdminDto, UpdateAdminDto } from './dto/admin.dto';

@ApiTags('Admin · Admin users')
@Controller('admin/admins')
@AdminAuth(AdminRole.SUPER_ADMIN)
export class AdminsController {
  constructor(private readonly admins: AdminsService) {}

  @Get()
  @ResponseMessage('Admins fetched')
  @ApiOperation({ summary: 'List admin users (SUPER_ADMIN)' })
  list() {
    return this.admins.list();
  }

  @Post()
  @ResponseMessage('Admin created')
  @ApiOperation({ summary: 'Create an admin user (SUPER_ADMIN)' })
  create(@Body() dto: CreateAdminDto, @CurrentAdmin() actor: AuthenticatedAdmin) {
    return this.admins.create(dto, actor.email);
  }

  @Patch(':id')
  @ResponseMessage('Admin updated')
  @ApiOperation({ summary: 'Update role / status / password of an admin (SUPER_ADMIN)' })
  update(@Param('id') id: string, @Body() dto: UpdateAdminDto, @CurrentAdmin() actor: AuthenticatedAdmin) {
    return this.admins.update(id, dto, actor.id, actor.email);
  }
}
