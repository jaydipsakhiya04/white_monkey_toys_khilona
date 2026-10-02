import { Body, Controller, HttpCode, Inject, Patch, Post, Req, Res } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import { AuthenticatedCustomer, CurrentCustomer, CustomerAuth } from '../common/decorators/customer-auth.decorators';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { APP_CONFIG, AppConfig, loadConfig } from '../config/configuration';
import { CustomerAuthResult, CustomerAuthService } from './customer-auth.service';
import {
  ChangeCustomerPasswordDto,
  CustomerLoginDto,
  CustomerSignupDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/customer-auth.dto';

/** httpOnly refresh-token cookie for storefront accounts (separate from the admin cookie). */
export const CUSTOMER_REFRESH_COOKIE = 'wmt_crt';
const loginLimit = () => loadConfig().throttle.loginLimit;

const AUTH_EXAMPLE = {
  success: true,
  message: 'Signed in successfully',
  data: {
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…',
    expiresIn: 900,
    customer: {
      id: 'clx0cust0001',
      name: 'Jaydip Patel',
      email: 'jaydip@example.com',
      phone: '9876543210',
      registeredAt: '2026-10-02T10:00:00.000Z',
      createdAt: '2026-10-02T10:00:00.000Z',
    },
  },
};

@ApiTags('Customer · Auth')
@Controller('auth/customer')
export class CustomerAuthController {
  constructor(
    private readonly auth: CustomerAuthService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Post('signup')
  @Throttle({ default: { limit: loginLimit, ttl: 60_000 } })
  @ResponseMessage('Account created')
  @ApiOperation({ summary: 'Create a customer account', description: 'Returns an access token and sets an httpOnly refresh-token cookie.' })
  @ApiCreatedResponse({ schema: { example: { ...AUTH_EXAMPLE, message: 'Account created' } } })
  @ApiConflictResponse({ description: 'Email or mobile number already registered' })
  async signup(@Body() dto: CustomerSignupDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.respondWithTokens(await this.auth.signup(dto, this.meta(req)), res);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: loginLimit, ttl: 60_000 } })
  @ResponseMessage('Signed in successfully')
  @ApiOperation({ summary: 'Customer login with email or mobile number' })
  @ApiOkResponse({ schema: { example: AUTH_EXAMPLE } })
  @ApiUnauthorizedResponse({ description: 'Email/mobile or password is incorrect' })
  @ApiTooManyRequestsResponse({ description: 'Too many login attempts' })
  async login(@Body() dto: CustomerLoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.respondWithTokens(await this.auth.login(dto.identifier, dto.password, this.meta(req)), res);
  }

  @Post('refresh')
  @HttpCode(200)
  @ResponseMessage('Session refreshed')
  @ApiOperation({ summary: 'Rotate the customer refresh token (cookie) and get a new access token' })
  @ApiOkResponse({ schema: { example: AUTH_EXAMPLE } })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      return this.respondWithTokens(await this.auth.refresh(req.cookies?.[CUSTOMER_REFRESH_COOKIE], this.meta(req)), res);
    } catch (err) {
      res.clearCookie(CUSTOMER_REFRESH_COOKIE, this.cookieOptions());
      throw err;
    }
  }

  @Post('logout')
  @HttpCode(200)
  @ResponseMessage('Signed out')
  @ApiOperation({ summary: 'Revoke the customer refresh token and clear the cookie' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[CUSTOMER_REFRESH_COOKIE]);
    res.clearCookie(CUSTOMER_REFRESH_COOKIE, this.cookieOptions());
    return null;
  }

  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { limit: loginLimit, ttl: 60_000 } })
  @ResponseMessage('If an account matches, password reset instructions will be sent')
  @ApiOperation({
    summary: 'Request a password reset link',
    description:
      'Never reveals whether an account exists. `deliveryAvailable` is false when no notification channel (email/SMS) is configured.',
  })
  @ApiOkResponse({ schema: { example: { success: true, message: 'If an account matches, password reset instructions will be sent', data: { deliveryAvailable: false } } } })
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    return this.auth.requestPasswordReset(dto.identifier, this.meta(req));
  }

  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { limit: loginLimit, ttl: 60_000 } })
  @ResponseMessage('Password updated. Please sign in with your new password.')
  @ApiOperation({ summary: 'Set a new password using a reset token (signs out all sessions)' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto);
    return null;
  }

  /** Lives under /auth/customer so the refresh cookie is sent and the current session is kept. */
  @Patch('password')
  @CustomerAuth()
  @ResponseMessage('Password changed')
  @ApiOperation({ summary: 'Change your password (signs out your other sessions)' })
  async changePassword(@CurrentCustomer() customer: AuthenticatedCustomer, @Body() dto: ChangeCustomerPasswordDto, @Req() req: Request) {
    await this.auth.changePassword(customer.id, dto, req.cookies?.[CUSTOMER_REFRESH_COOKIE]);
    return null;
  }

  private respondWithTokens(result: CustomerAuthResult, res: Response) {
    res.cookie(CUSTOMER_REFRESH_COOKIE, result.refreshToken, { ...this.cookieOptions(), expires: result.refreshExpiresAt });
    return { accessToken: result.accessToken, expiresIn: result.expiresIn, customer: result.customer };
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.cookie.secure,
      sameSite: this.config.cookie.sameSite,
      domain: this.config.cookie.domain,
      path: '/api/auth/customer',
    };
  }

  private meta(req: Request) {
    return { ip: req.ip, userAgent: req.headers['user-agent'] };
  }
}
