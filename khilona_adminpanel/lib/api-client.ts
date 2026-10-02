import { API_URL } from '@/lib/env';
import { notifySessionExpired, session } from '@/lib/session';
import type { ApiErrorBody, ApiFieldError, AuthResponse } from '@/types/api';

export class ApiError extends Error {
  readonly status: number;
  readonly errors: ApiFieldError[];

  constructor(status: number, message: string, errors: ApiFieldError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

/** Human friendly message for any thrown error. */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (isApiError(err)) {
    if (err.status === 0) return "Can't reach the server. Check your connection and try again.";
    if (err.status === 403) return "You don't have permission to do this. Ask a super admin if you need access.";
    if (err.status === 429) return 'Too many attempts. Please wait a minute and try again.';
    if (err.status >= 500) return 'The server ran into a problem. Please try again in a moment.';
    return err.message || fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

type QueryValue = string | number | boolean | null | undefined;

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, QueryValue>;
  body?: unknown;
  /** Attach bearer token + handle 401 with refresh (default true). */
  auth?: boolean;
  signal?: AbortSignal;
};

export function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function toApiError(status: number, body: unknown, statusText: string): ApiError {
  if (body && typeof body === 'object') {
    const b = body as Partial<ApiErrorBody> & { message?: unknown };
    const message = Array.isArray(b.message) ? b.message.join(', ') : typeof b.message === 'string' ? b.message : statusText;
    const errors = Array.isArray(b.errors) ? b.errors : [];
    return new ApiError(status, message || 'Request failed', errors);
  }
  return new ApiError(status, typeof body === 'string' && body ? body : statusText || 'Request failed');
}

function unwrap<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

// ---------------------------------------------------------------------------
// Refresh (single flight)
// ---------------------------------------------------------------------------

export type RefreshResult = 'ok' | 'unauthorized' | 'network';
let refreshPromise: Promise<RefreshResult> | null = null;

export function refreshSession(): Promise<RefreshResult> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async (): Promise<RefreshResult> => {
    try {
      const res = await fetch(buildUrl('/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const body = await parseBody(res);
      if (!res.ok) {
        session.clear();
        return res.status === 401 || res.status === 403 ? 'unauthorized' : 'network';
      }
      const data = unwrap<AuthResponse>(body);
      session.set(data.accessToken, data.expiresIn, data.admin);
      return 'ok';
    } catch {
      return 'network';
    } finally {
      // allow next refresh after this one settles
      setTimeout(() => {
        refreshPromise = null;
      }, 0);
    }
  })();
  return refreshPromise;
}

// ---------------------------------------------------------------------------
// JSON requests
// ---------------------------------------------------------------------------

export async function apiRequest<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const { method = 'GET', query, body, auth = true, signal } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  const token = session.getAccessToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      credentials: 'include',
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, 'Network error');
  }

  if (res.status === 401 && auth && !retried) {
    const result = await refreshSession();
    if (result === 'ok') return apiRequest<T>(path, options, true);
    if (result === 'unauthorized') notifySessionExpired();
  }

  const parsed = await parseBody(res);
  if (!res.ok) {
    const error = toApiError(res.status, parsed, res.statusText);
    if (res.status === 401 && auth && retried) notifySessionExpired();
    throw error;
  }
  return unwrap<T>(parsed);
}

export const api = {
  get: <T>(path: string, query?: Record<string, QueryValue>, signal?: AbortSignal) =>
    apiRequest<T>(path, { method: 'GET', query, signal }),
  post: <T>(path: string, body?: unknown, query?: Record<string, QueryValue>) =>
    apiRequest<T>(path, { method: 'POST', body, query }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string, query?: Record<string, QueryValue>) => apiRequest<T>(path, { method: 'DELETE', query }),
};

// ---------------------------------------------------------------------------
// Multipart upload with progress (XHR, since fetch has no upload progress)
// ---------------------------------------------------------------------------

export function uploadWithProgress<T>(
  path: string,
  form: FormData,
  query: Record<string, QueryValue> | undefined,
  onProgress?: (percent: number) => void,
  retried = false,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', buildUrl(path, query));
    xhr.withCredentials = true;
    xhr.setRequestHeader('Accept', 'application/json');
    const token = session.getAccessToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => reject(new ApiError(0, 'Network error'));
    xhr.onload = async () => {
      let body: unknown = null;
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        body = xhr.responseText;
      }
      if (xhr.status === 401 && !retried) {
        const result = await refreshSession();
        if (result === 'ok') {
          uploadWithProgress<T>(path, form, query, onProgress, true).then(resolve, reject);
          return;
        }
        if (result === 'unauthorized') notifySessionExpired();
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        if (xhr.status === 413) return reject(new ApiError(413, 'Image is too large. Maximum size is 5 MB.'));
        if (xhr.status === 415) return reject(new ApiError(415, 'Unsupported file type. Use JPG, PNG, WebP, AVIF or GIF.'));
        return reject(toApiError(xhr.status, body, xhr.statusText));
      }
      resolve(unwrap<T>(body));
    };
    xhr.send(form);
  });
}
