import { applyDecorators, createParamDecorator, ExecutionContext, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthenticatedCustomer, CustomerAuthGuard, OptionalCustomerAuthGuard } from '../guards/customer-auth.guard';

export type { AuthenticatedCustomer } from '../guards/customer-auth.guard';

/** Requires a signed-in customer (storefront account). */
export function CustomerAuth() {
  return applyDecorators(
    UseGuards(CustomerAuthGuard),
    ApiBearerAuth('customer-token'),
    ApiUnauthorizedResponse({ description: 'Missing, invalid or expired customer access token' }),
  );
}

/** Works for guests and signed-in customers alike (e.g. checkout). */
export function OptionalCustomerAuth() {
  return applyDecorators(UseGuards(OptionalCustomerAuthGuard), ApiBearerAuth('customer-token'));
}

/** The signed-in customer, or undefined for guests on optional routes. */
export const CurrentCustomer = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthenticatedCustomer | undefined => {
  return ctx.switchToHttp().getRequest().customer;
});
