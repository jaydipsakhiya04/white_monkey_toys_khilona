import { applyDecorators, createParamDecorator, ExecutionContext, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

export const ROLES_KEY = 'roles';

export interface AuthenticatedAdmin {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}

/** Protects a controller/handler with JWT auth and (optionally) restricts roles. */
export function AdminAuth(...roles: AdminRole[]) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth('access-token'),
    ApiUnauthorizedResponse({ description: 'Missing, invalid or expired access token' }),
    ApiForbiddenResponse({ description: 'Insufficient role' }),
  );
}

/** Injects the authenticated admin (set by JwtAuthGuard). */
export const CurrentAdmin = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthenticatedAdmin => {
  return ctx.switchToHttp().getRequest().admin;
});
