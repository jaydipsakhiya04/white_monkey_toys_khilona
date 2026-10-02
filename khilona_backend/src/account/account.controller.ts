import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Res } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthenticatedCustomer, CurrentCustomer, CustomerAuth } from '../common/decorators/customer-auth.decorators';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { loadConfig } from '../config/configuration';
import { UpdateCustomerProfileDto } from '../customer-auth/dto/customer-auth.dto';
import { sendPdf } from '../documents/send-pdf';
import { TrackOrderQueryDto } from '../orders/dto/order.dto';
import { AccountService } from './account.service';
import { CancelOrderDto, ClaimOrderDto, CustomerOrderQueryDto } from './dto/account.dto';

const trackLimit = () => loadConfig().throttle.trackLimit;

/**
 * Self-service for signed-in customers. Every order route is scoped to the caller's own
 * account: another customer's order number returns 404, never data.
 */
@ApiTags('Customer · Account')
@Controller('customer')
@CustomerAuth()
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get('profile')
  @ResponseMessage('Profile fetched')
  @ApiOperation({ summary: 'Signed-in customer profile' })
  profile(@CurrentCustomer() customer: AuthenticatedCustomer) {
    return this.account.profile(customer.id);
  }

  @Patch('profile')
  @ResponseMessage('Profile updated')
  @ApiOperation({ summary: 'Update name, email or mobile number' })
  @ApiConflictResponse({ description: 'Email or mobile already used by another account' })
  updateProfile(@CurrentCustomer() customer: AuthenticatedCustomer, @Body() dto: UpdateCustomerProfileDto) {
    return this.account.updateProfile(customer.id, dto);
  }

  @Get('orders/summary')
  @ResponseMessage('Order summary fetched')
  @ApiOperation({ summary: 'Totals (all / active / delivered / cancelled) and the three most recent orders' })
  summary(@CurrentCustomer() customer: AuthenticatedCustomer) {
    return this.account.orderSummary(customer.id);
  }

  @Get('orders')
  @ResponseMessage('Orders fetched successfully')
  @ApiOperation({ summary: 'Your orders, newest first' })
  orders(@CurrentCustomer() customer: AuthenticatedCustomer, @Query() query: CustomerOrderQueryDto) {
    return this.account.listOrders(customer.id, query);
  }

  @Post('orders/claim')
  @HttpCode(200)
  @ResponseMessage('Order added to your account')
  @ApiOperation({ summary: 'Add an earlier guest order (placed with your mobile number) to your account' })
  @ApiNotFoundResponse()
  claim(@CurrentCustomer() customer: AuthenticatedCustomer, @Body() dto: ClaimOrderDto) {
    return this.account.claimOrder(customer, dto.orderNumber);
  }

  @Get('orders/:orderNumber')
  @ResponseMessage('Order fetched successfully')
  @ApiOperation({ summary: 'Order details with tracking, review eligibility and available documents' })
  @ApiNotFoundResponse()
  order(@CurrentCustomer() customer: AuthenticatedCustomer, @Param('orderNumber') orderNumber: string) {
    return this.account.orderDetail(customer.id, orderNumber);
  }

  @Post('orders/:orderNumber/cancel')
  @HttpCode(200)
  @ResponseMessage('Order cancelled')
  @ApiOperation({ summary: 'Cancel your order while it is still pending (stock is restored)' })
  @ApiConflictResponse({ description: 'Order already confirmed by the store' })
  cancel(@CurrentCustomer() customer: AuthenticatedCustomer, @Param('orderNumber') orderNumber: string, @Body() dto: CancelOrderDto) {
    return this.account.cancelOrder(customer, orderNumber, dto.reason);
  }

  @Get('orders/:orderNumber/invoice')
  @ApiOperation({ summary: 'Download the invoice PDF of your order' })
  @ApiProduces('application/pdf')
  @ApiOkResponse({ description: 'PDF file' })
  @ApiNotFoundResponse()
  async invoice(@CurrentCustomer() customer: AuthenticatedCustomer, @Param('orderNumber') orderNumber: string, @Res() res: Response) {
    sendPdf(res, await this.account.document(customer.id, orderNumber, 'invoice'));
  }

  @Get('orders/:orderNumber/receipt')
  @ApiOperation({ summary: 'Download the order receipt PDF of your order' })
  @ApiProduces('application/pdf')
  @ApiOkResponse({ description: 'PDF file' })
  @ApiNotFoundResponse()
  async receipt(@CurrentCustomer() customer: AuthenticatedCustomer, @Param('orderNumber') orderNumber: string, @Res() res: Response) {
    sendPdf(res, await this.account.document(customer.id, orderNumber, 'receipt'));
  }
}

/**
 * Guest access to documents, using the same proof as guest tracking (order number + the mobile
 * number used for the order). POST keeps the mobile number out of URLs and access logs.
 */
@ApiTags('Cart & Orders')
@Controller('orders/track')
export class GuestDocumentsController {
  constructor(private readonly account: AccountService) {}

  @Post('invoice')
  @HttpCode(200)
  @Throttle({ default: { limit: trackLimit, ttl: 60_000 } })
  @ApiOperation({ summary: 'Download the invoice PDF of a guest order (order number + mobile)' })
  @ApiProduces('application/pdf')
  @ApiNotFoundResponse()
  async invoice(@Body() dto: TrackOrderQueryDto, @Res() res: Response) {
    sendPdf(res, await this.account.guestDocument(dto.orderNumber, dto.phone, 'invoice'));
  }

  @Post('receipt')
  @HttpCode(200)
  @Throttle({ default: { limit: trackLimit, ttl: 60_000 } })
  @ApiOperation({ summary: 'Download the order receipt PDF of a guest order (order number + mobile)' })
  @ApiProduces('application/pdf')
  @ApiNotFoundResponse()
  async receipt(@Body() dto: TrackOrderQueryDto, @Res() res: Response) {
    sendPdf(res, await this.account.guestDocument(dto.orderNumber, dto.phone, 'receipt'));
  }
}
