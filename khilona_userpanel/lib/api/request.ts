import type { ApiErrorBody, ApiSuccess } from "@/types/api";
import { ApiError } from "./errors";

type Query = Record<string, string | number | boolean | null | undefined>;

export function buildQuery(params?: Query): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "" || v === false) continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/**
 * Perform a request against the API and unwrap the `{ success, message, data }` envelope.
 * Throws `ApiError` on network failure, non-2xx or `success: false`.
 */
export async function request<T>(url: string, init?: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(0, "Network error");
  }

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!res.ok || !body || (body as { success?: boolean }).success === false) {
    const err = (body ?? {}) as Partial<ApiErrorBody>;
    throw new ApiError(
      res.ok ? 500 : res.status,
      typeof err.message === "string" && err.message ? err.message : res.statusText || "Request failed",
      Array.isArray(err.errors) ? err.errors : [],
    );
  }
  return (body as ApiSuccess<T>).data;
}
