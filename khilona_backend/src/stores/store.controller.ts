import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuth, AuthenticatedAdmin, CurrentAdmin } from '../common/decorators/auth.decorators';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoreService } from './store.service';

const STORE_EXAMPLE = {
  success: true,
  message: 'Store fetched successfully',
  data: {
    id: 'clx0store0001',
    name: 'Khilona',
    tagline: 'Toys, games & joyful gifts',
    phone: '+91 98765 43210',
    whatsapp: '919876543210',
    openingTime: '10:00',
    closingTime: '21:00',
    isOpen: true,
    isOpenNow: true,
    whatsappUrl: 'https://wa.me/919876543210',
    phoneUrl: 'tel:+919876543210',
  },
};

@ApiTags('Store')
@Controller('store')
export class StoreController {
  constructor(private readonly store: StoreService) {}

  @Get()
  @ResponseMessage('Store fetched successfully')
  @ApiOperation({ summary: 'Public store information' })
  @ApiOkResponse({ schema: { example: STORE_EXAMPLE } })
  get() {
    return this.store.getPublic();
  }
}

@ApiTags('Admin · Store')
@Controller('admin/store')
@AdminAuth()
export class AdminStoreController {
  constructor(private readonly store: StoreService) {}

  @Get()
  @ResponseMessage('Store fetched successfully')
  @ApiOperation({ summary: 'Store settings (admin)' })
  get() {
    return this.store.get();
  }

  @Put()
  @ResponseMessage('Store settings saved')
  @ApiOperation({ summary: 'Update store settings (any subset of fields)' })
  update(@Body() dto: UpdateStoreDto, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.store.update(dto, admin.email);
  }
}
