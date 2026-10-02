import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';

export interface AccessTokenPayload {
  sub: string;
  role: string;
  type: 'access';
}

/**
 * Validates the Bearer access token and loads the admin from the database on every request,
 * so deactivated admins lose access immediately.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger('Auth');

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const header: string | undefined = req.headers['authorization'];
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
    if (!token) throw new UnauthorizedException('Unauthorized');

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
    } catch (err) {
      if (err instanceof TokenExpiredError) throw new UnauthorizedException('Session expired');
      this.logger.warn(`Rejected invalid access token from ${req.ip}`);
      throw new UnauthorizedException('Unauthorized');
    }
    if (payload.type !== 'access') throw new UnauthorizedException('Unauthorized');

    const admin = await this.prisma.admin.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    if (!admin || !admin.isActive) throw new UnauthorizedException('Unauthorized');

    req.admin = { id: admin.id, name: admin.name, email: admin.email, role: admin.role };
    return true;
  }
}
