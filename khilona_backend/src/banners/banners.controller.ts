import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuth, AuthenticatedAdmin, CurrentAdmin } from '../common/decorators/auth.decorators';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { BannersService } from './banners.service';
import { CreateBannerDto, ReorderBannersDto, UpdateBannerDto } from './dto/banner.dto';

@ApiTags('Store')
@Controller('banners')
export class BannersController {
  constructor(private readonly banners: BannersService) {}

  @Get()
  @ResponseMessage('Banners fetched successfully')
  @ApiOperation({ summary: 'Live home page slider banners (active and within their schedule)' })
  list() {
    return this.banners.listPublic();
  }
}

@ApiTags('Admin · Banners')
@Controller('admin/banners')
@AdminAuth()
export class AdminBannersController {
  constructor(private readonly banners: BannersService) {}

  @Get()
  @ResponseMessage('Banners fetched successfully')
  @ApiOperation({ summary: 'All banners with their live state' })
  list() {
    return this.banners.listAdmin();
  }

  @Post()
  @ResponseMessage('Banner created')
  @ApiOperation({ summary: 'Add a slider banner' })
  create(@Body() dto: CreateBannerDto, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.banners.create(dto, admin.email);
  }

  @Put('order')
  @ResponseMessage('Banner order saved')
  @ApiOperation({ summary: 'Save the display order of banners' })
  reorder(@Body() dto: ReorderBannersDto, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.banners.reorder(dto.ids, admin.email);
  }

  @Patch(':id')
  @ResponseMessage('Banner updated')
  @ApiOperation({ summary: 'Update a banner' })
  @ApiNotFoundResponse()
  update(@Param('id') id: string, @Body() dto: UpdateBannerDto, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.banners.update(id, dto, admin.email);
  }

  @Delete(':id')
  @ResponseMessage('Banner deleted')
  @ApiOperation({ summary: 'Delete a banner' })
  @ApiNotFoundResponse()
  remove(@Param('id') id: string, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.banners.remove(id, admin.email);
  }
}
