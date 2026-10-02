import type { ApiFieldError } from "@/types/api";

/** Typed error for any non-2xx / malformed API response or network failure. */
export class ApiError extends Error {
  readonly status: number;
  readonly errors: ApiFieldError[];

  constructor(status: number, message: string, errors: ApiFieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }

  /** status 0 = network error / API unreachable */
  get isNetworkError() {
    return this.status === 0;
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

export function errorMessage(e: unknown, fallback = "Something went wrong. Please try again."): string {
  if (isApiError(e)) {
    if (e.isNetworkError) return "We couldn't reach the store. Check your connection and try again.";
    if (e.status === 429) return "Too many requests. Please wait a moment and try again.";
    return e.message || fallback;
  }
  return fallback;
}
