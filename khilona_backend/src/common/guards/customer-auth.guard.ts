import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';

/** Customer access tokens use their own audience so they can never be used on admin routes (and vice versa). */
export const CUSTOMER_AUDIENCE = 'khilona-customer';

export interface CustomerAccessTokenPayload {
  sub: string;
  type: 'customer';
}

export interface AuthenticatedCustomer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

function bearer(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  const header = req.headers['authorization'];
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

/**
 * Validates a customer Bearer token and loads the account on every request, so deactivated
 * accounts lose access immediately. With `optional`, requests without a token pass through as
 * guests — but a token that is present and invalid/expired is still rejected (401) so the client
 * can refresh it instead of silently acting as a guest.
 */
@Injectable()
abstract class BaseCustomerGuard implements CanActivate {
  private readonly logger = new Logger('CustomerAuth');
  protected abstract readonly optional: boolean;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = bearer(req);
    if (!token) {
      if (this.optional) return true;
      throw new UnauthorizedException('Please sign in to continue');
    }

    let payload: CustomerAccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<CustomerAccessTokenPayload>(token, { audience: CUSTOMER_AUDIENCE });
    } catch (err) {
      if (err instanceof TokenExpiredError) throw new UnauthorizedException('Session expired');
      if (!(err instanceof Error) || !('name' in err) || !/JsonWebTokenError|NotBeforeError/.test(err.name)) throw err;
      this.logger.warn(`Rejected invalid customer access token from ${req.ip}`);
      throw new UnauthorizedException('Unauthorized');
    }
    if (payload.type !== 'customer') throw new UnauthorizedException('Unauthorized');

    const customer = await this.prisma.customer.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, phone: true, email: true, isActive: true, passwordHash: true },
    });
    if (!customer || !customer.isActive || !customer.passwordHash) throw new UnauthorizedException('Unauthorized');

    req.customer = { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email } satisfies AuthenticatedCustomer;
    return true;
  }
}

@Injectable()
export class CustomerAuthGuard extends BaseCustomerGuard {
  protected readonly optional = false;
}

@Injectable()
export class OptionalCustomerAuthGuard extends BaseCustomerGuard {
  protected readonly optional = true;
}
