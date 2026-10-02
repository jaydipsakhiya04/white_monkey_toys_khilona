import { Body, Controller, Get, HttpCode, Inject, Patch, Post, Req, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiTooManyRequestsResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import { AdminAuth, AuthenticatedAdmin, CurrentAdmin } from '../common/decorators/auth.decorators';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { APP_CONFIG, AppConfig, loadConfig } from '../config/configuration';
import { AuthResult, AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto, UpdateProfileDto } from './dto/auth.dto';

export const REFRESH_COOKIE = 'khilona_rt';
const loginLimit = () => loadConfig().throttle.loginLimit;

const AUTH_EXAMPLE = {
  success: true,
  message: 'Signed in successfully',
  data: {
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…',
    expiresIn: 900,
    admin: {
      id: 'clx0admin0001',
      name: 'Khilona Admin',
      email: 'admin@khilona.in',
      phone: '9876543210',
      role: 'SUPER_ADMIN',
      isActive: true,
      lastLoginAt: '2026-10-02T10:00:00.000Z',
      createdAt: '2026-10-01T10:00:00.000Z',
    },
  },
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: loginLimit, ttl: 60_000 } })
  @ResponseMessage('Signed in successfully')
  @ApiOperation({ summary: 'Admin login', description: 'Returns a short-lived access token and sets an httpOnly refresh-token cookie.' })
  @ApiOkResponse({ schema: { example: AUTH_EXAMPLE } })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  @ApiTooManyRequestsResponse({ description: 'Too many login attempts' })
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto.email, dto.password, this.meta(req));
    return this.respondWithTokens(result, res);
  }

  @Post('refresh')
  @HttpCode(200)
  @ResponseMessage('Session refreshed')
  @ApiOperation({ summary: 'Rotate refresh token (cookie) and get a new access token' })
  @ApiOkResponse({ schema: { example: AUTH_EXAMPLE } })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      const result = await this.auth.refresh(req.cookies?.[REFRESH_COOKIE], this.meta(req));
      return this.respondWithTokens(result, res);
    } catch (err) {
      res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
      throw err;
    }
  }

  @Post('logout')
  @HttpCode(200)
  @ResponseMessage('Signed out')
  @ApiOperation({ summary: 'Revoke the refresh token and clear the cookie' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
    return null;
  }

  @Get('me')
  @AdminAuth()
  @ResponseMessage('Profile fetched')
  @ApiOperation({ summary: 'Current admin profile' })
  me(@CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.auth.me(admin.id);
  }

  @Patch('me')
  @AdminAuth()
  @ResponseMessage('Profile updated')
  @ApiOperation({ summary: 'Update own name / phone' })
  updateMe(@CurrentAdmin() admin: AuthenticatedAdmin, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(admin.id, dto);
  }

  @Patch('me/password')
  @AdminAuth()
  @ResponseMessage('Password changed')
  @ApiOperation({ summary: 'Change own password (revokes other sessions)' })
  @ApiUnauthorizedResponse()
  async changePassword(@CurrentAdmin() admin: AuthenticatedAdmin, @Body() dto: ChangePasswordDto, @Req() req: Request) {
    await this.auth.changePassword(admin.id, dto, req.cookies?.[REFRESH_COOKIE]);
    return null;
  }

  private respondWithTokens(result: AuthResult, res: Response) {
    res.cookie(REFRESH_COOKIE, result.refreshToken, {
      ...this.cookieOptions(),
      expires: result.refreshExpiresAt,
    });
    return { accessToken: result.accessToken, expiresIn: result.expiresIn, admin: result.admin };
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.cookie.secure,
      sameSite: this.config.cookie.sameSite,
      domain: this.config.cookie.domain,
      path: '/api/auth',
    };
  }

  private meta(req: Request) {
    return { ip: req.ip, userAgent: req.headers['user-agent'] };
  }
}
