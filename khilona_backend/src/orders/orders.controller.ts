import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Req } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AdminAuth, AuthenticatedAdmin, CurrentAdmin } from '../common/decorators/auth.decorators';
import { AuthenticatedCustomer, CurrentCustomer, OptionalCustomerAuth } from '../common/decorators/customer-auth.decorators';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { loadConfig } from '../config/configuration';
import { CartPricingService } from './cart-pricing.service';
import {
  AdminOrderQueryDto,
  CreateOrderDto,
  TrackOrderQueryDto,
  UpdateOrderDto,
  UpdateOrderStatusDto,
  ValidateCartDto,
} from './dto/order.dto';
import { OrdersService } from './orders.service';

const orderLimit = () => loadConfig().throttle.orderLimit;
const trackLimit = () => loadConfig().throttle.trackLimit;

const PUBLIC_ORDER_EXAMPLE = {
  success: true,
  message: 'Order placed successfully',
  data: {
    orderNumber: 'WMT-20261002-0001',
    status: 'PENDING',
    createdAt: '2026-10-02T09:30:00.000Z',
    customerName: 'Ananya Mehta',
    customerPhone: '9876543210',
    address: 'Flat 302, Sunrise Residency, 14 MG Road',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380009',
    items: [
      {
        productName: 'Turbo Racer Remote Control Car',
        variantTitle: 'Red',
        options: [{ name: 'Color', value: 'Red' }],
        quantity: 1,
        unitMrp: 1499,
        unitPrice: 1199,
        lineTotal: 1199,
      },
    ],
    itemsCount: 1,
    subtotal: 1499,
    discount: 300,
    shippingFee: 0,
    total: 1199,
    paymentMethod: 'CASH_ON_DELIVERY',
    paymentStatus: 'UNPAID',
    history: [{ status: 'PENDING', createdAt: '2026-10-02T09:30:00.000Z' }],
  },
};

@ApiTags('Cart & Orders')
@Controller()
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly cartPricing: CartPricingService,
  ) {}

  @Post('cart/validate')
  @HttpCode(200)
  @ResponseMessage('Cart validated')
  @ApiOperation({ summary: 'Re-price and validate a cart against live stock and prices' })
  async validateCart(@Body() dto: ValidateCartDto) {
    return this.cartPricing.toPublic(await this.cartPricing.evaluate(dto.items));
  }

  @Post('orders')
  @Throttle({ default: { limit: orderLimit, ttl: 60_000 } })
  @ResponseMessage('Order placed successfully')
  @OptionalCustomerAuth()
  @ApiOperation({
    summary: 'Place an order (pay on delivery, no online payment)',
    description: 'Works for guests. With a customer access token the order is linked to that account (My orders).',
  })
  @ApiCreatedResponse({ schema: { example: PUBLIC_ORDER_EXAMPLE } })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Items unavailable / insufficient stock' })
  @ApiForbiddenResponse({ description: 'Store is not accepting orders' })
  create(@Body() dto: CreateOrderDto, @Req() req: Request, @CurrentCustomer() customer?: AuthenticatedCustomer) {
    return this.orders.create(dto, { ip: req.ip, userAgent: req.headers['user-agent'] }, customer);
  }

  @Get('orders/track')
  @Throttle({ default: { limit: trackLimit, ttl: 60_000 } })
  @ResponseMessage('Order fetched successfully')
  @ApiOperation({ summary: 'Track an order with order number + mobile number' })
  @ApiOkResponse({ schema: { example: PUBLIC_ORDER_EXAMPLE } })
  @ApiNotFoundResponse()
  track(@Query() query: TrackOrderQueryDto) {
    return this.orders.track(query.orderNumber, query.phone);
  }
}

@ApiTags('Admin · Orders')
@Controller('admin/orders')
@AdminAuth()
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ResponseMessage('Orders fetched successfully')
  @ApiOperation({ summary: 'Search / filter / paginate orders' })
  list(@Query() query: AdminOrderQueryDto) {
    return this.orders.adminList(query);
  }

  @Get('status-counts')
  @ResponseMessage('Order counts fetched')
  @ApiOperation({ summary: 'Number of orders per status (+ ALL)' })
  counts() {
    return this.orders.statusCounts();
  }

  @Get(':id')
  @ResponseMessage('Order fetched successfully')
  @ApiOperation({ summary: 'Order details (id or order number)' })
  @ApiNotFoundResponse()
  get(@Param('id') id: string) {
    return this.orders.adminGet(id);
  }

  @Patch(':id/status')
  @ResponseMessage('Order status updated')
  @ApiOperation({ summary: 'Change order status (validated transitions; cancelling restores stock)' })
  @ApiConflictResponse({ description: 'Invalid status transition' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.orders.updateStatus(id, dto, admin);
  }

  @Patch(':id')
  @ResponseMessage('Order updated')
  @ApiOperation({ summary: 'Update internal note / payment status' })
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.orders.update(id, dto, admin);
  }
}
