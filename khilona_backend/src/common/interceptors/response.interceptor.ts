import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { map, Observable } from 'rxjs';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

/** Recursively converts Prisma Decimals to numbers so the API never leaks decimal strings. */
export function serializeDecimals(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Prisma.Decimal.isDecimal(value)) return Number((value as Prisma.Decimal).toString());
  if (value instanceof Date || Buffer.isBuffer(value)) return value;
  if (Array.isArray(value)) return value.map(serializeDecimals);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = serializeDecimals(v);
    return out;
  }
  return value;
}

/** Wraps every successful response in `{ success, message, data }`. */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccess<unknown>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccess<unknown>> {
    const message =
      this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [context.getHandler(), context.getClass()]) ??
      'Request successful';
    return next.handle().pipe(
      map((data) => ({ success: true as const, message, data: serializeDecimals(data ?? null) })),
    );
  }
}
