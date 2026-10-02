import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/** Logs method, path, status and duration. Never logs bodies, headers or query secrets. */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      const line = `${req.method} ${req.originalUrl.split('?')[0]} ${res.statusCode} ${ms.toFixed(1)}ms`;
      if (res.statusCode >= 500) this.logger.error(line);
      else if (res.statusCode >= 400) this.logger.warn(line);
      else if (process.env.NODE_ENV !== 'test') this.logger.log(line);
    });
    next();
  }
}
