import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/auth.decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<AdminRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;
    const admin = context.switchToHttp().getRequest().admin;
    if (!admin) return false;
    // SUPER_ADMIN can do everything an ADMIN can.
    if (admin.role === AdminRole.SUPER_ADMIN || roles.includes(admin.role)) return true;
    throw new ForbiddenException('You do not have permission to perform this action');
  }
}
