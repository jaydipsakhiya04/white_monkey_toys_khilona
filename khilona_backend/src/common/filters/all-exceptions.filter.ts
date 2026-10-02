import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

export interface FieldError {
  field?: string;
  message: string;
}

export interface ApiErrorBody {
  success: false;
  statusCode: number;
  message: string;
  errors: FieldError[];
}

const DEFAULT_MESSAGES: Record<number, string> = {
  400: 'Bad request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Resource not found',
  409: 'Conflict',
  413: 'File is too large',
  415: 'Unsupported file type',
  422: 'Validation failed',
  429: 'Too many requests. Please slow down and try again shortly.',
  500: 'Something went wrong on our side. Please try again.',
};

/**
 * Normalises every error (HTTP, validation, Prisma, unexpected) into the standard error envelope.
 * Internal details are logged server-side and never leaked to clients.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const { status, message, errors } = this.resolve(exception);

    if (status >= 500) {
      this.logger.error(
        `${req.method} ${req.originalUrl} -> ${status}: ${(exception as Error)?.message ?? exception}`,
        (exception as Error)?.stack,
      );
    } else if (status !== 404 && status !== 401) {
      this.logger.warn(`${req.method} ${req.originalUrl} -> ${status}: ${message}`);
    }

    const body: ApiErrorBody = { success: false, statusCode: status, message, errors };
    if (!res.headersSent) res.status(status).json(body);
  }

  private resolve(exception: unknown): { status: number; message: string; errors: FieldError[] } {
    if (exception instanceof ThrottlerException) {
      return { status: 429, message: DEFAULT_MESSAGES[429], errors: [] };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      let message = DEFAULT_MESSAGES[status] ?? exception.message;
      let errors: FieldError[] = [];
      if (typeof response === 'string') {
        message = response;
      } else if (response && typeof response === 'object') {
        const r = response as { message?: string | string[]; errors?: FieldError[] };
        if (Array.isArray(r.message)) {
          errors = r.message.map((m) => ({ message: m }));
          message = DEFAULT_MESSAGES[status] ?? 'Request failed';
        } else if (typeof r.message === 'string') {
          message = r.message;
        }
        if (Array.isArray(r.errors)) errors = r.errors;
      }
      // Multer / body parser messages are not user friendly.
      if (status === 413) message = message.includes('large') ? message : DEFAULT_MESSAGES[413];
      return { status, message, errors };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          const target = (exception.meta?.target as string[] | string | undefined) ?? [];
          const fields = Array.isArray(target) ? target : [target];
          const field = fields.find((f) => f !== 'id') ?? fields[0];
          const label = field === 'sku' ? 'SKU' : field;
          return {
            status: 409,
            message: field ? `This ${label} is already in use` : 'A record with these values already exists',
            errors: field ? [{ field, message: `This ${label} is already in use` }] : [],
          };
        }
        case 'P2025':
          return { status: 404, message: DEFAULT_MESSAGES[404], errors: [] };
        case 'P2003':
          return {
            status: 409,
            message: 'This record is referenced by other data and cannot be changed this way',
            errors: [],
          };
      }
    }

    if (exception instanceof SyntaxError && 'body' in (exception as object)) {
      return { status: 400, message: 'Malformed JSON body', errors: [] };
    }

    return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: DEFAULT_MESSAGES[500], errors: [] };
  }
}
