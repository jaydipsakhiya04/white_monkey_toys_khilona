import { CallHandler, ExecutionContext, Inject, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../../config/configuration';

/** Admin routes whose changes are visible on the storefront. */
const STOREFRONT_CONTENT = /^\/api\/admin\/(store|banners|products|categories)(\/|$|\?)/;

/**
 * After a successful admin change to storefront content (store settings, banners, products,
 * categories), asks the storefront to drop its cached pages so the change — e.g. a removed cover
 * image — shows immediately instead of after the cache period. Fire-and-forget: a storefront that
 * is down never fails the admin request.
 */
@Injectable()
export class StorefrontRevalidateInterceptor implements NestInterceptor {
  private readonly logger = new Logger('StorefrontCache');
  private timer: NodeJS.Timeout | null = null;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const relevant = req.method !== 'GET' && STOREFRONT_CONTENT.test(req.originalUrl) && !!this.config.storefrontRevalidateSecret;
    return relevant ? next.handle().pipe(tap(() => this.schedule())) : next.handle();
  }

  /** Bulk edits fire many requests; refresh once they settle. */
  private schedule() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.revalidate();
    }, 400);
  }

  private async revalidate() {
    try {
      const res = await fetch(`${this.config.storefrontUrl}/api/revalidate`, {
        method: 'POST',
        headers: { 'x-revalidate-secret': this.config.storefrontRevalidateSecret },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) this.logger.warn(`Storefront refresh failed: HTTP ${res.status}`);
    } catch (err) {
      this.logger.debug(`Storefront refresh skipped: ${(err as Error).message}`);
    }
  }
}
