import { Injectable, PipeTransform, UnprocessableEntityException, ValidationError, ValidationPipe } from '@nestjs/common';
import type { FieldError } from '../filters/all-exceptions.filter';

/** Flattens nested class-validator errors into `{ field: "items.0.quantity", message }`. */
export function flattenValidationErrors(errors: ValidationError[], parent = ''): FieldError[] {
  const out: FieldError[] = [];
  for (const err of errors) {
    const field = parent ? `${parent}.${err.property}` : err.property;
    if (err.constraints) {
      // One message per field is enough for forms; take the first.
      const first = Object.values(err.constraints)[0];
      if (first) out.push({ field, message: first });
    }
    if (err.children?.length) out.push(...flattenValidationErrors(err.children, field));
  }
  return out;
}

export function createValidationPipe() {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidUnknownValues: false,
    validationError: { target: false, value: false },
    exceptionFactory: (errors) => {
      const fieldErrors = flattenValidationErrors(errors);
      return new UnprocessableEntityException({
        message: fieldErrors[0]?.message ? `Validation failed: ${fieldErrors[0].message}` : 'Validation failed',
        errors: fieldErrors,
      });
    },
  });
}

/**
 * Basic input sanitisation applied to every request body before validation:
 * trims strings and strips NUL / non-printable control characters.
 * (HTML is not stripped – output is always escaped by the React frontends.)
 */
@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: unknown, metadata: { type: string }) {
    if (metadata.type !== 'body' && metadata.type !== 'query') return value;
    return this.clean(value, 0);
  }

  private clean(value: unknown, depth: number): unknown {
    if (depth > 10) return value;
    if (typeof value === 'string') {
      // eslint-disable-next-line no-control-regex
      return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
    }
    if (Array.isArray(value)) return value.map((v) => this.clean(v, depth + 1));
    if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
        out[k] = this.clean(v, depth + 1);
      }
      return out;
    }
    return value;
  }
}
