"use client";

import { PUBLIC_API_URL } from "@/lib/env";
import { sessionSnapshot } from "@/lib/auth/session";
import type { CustomerAuthResponse } from "@/types/api";
import { ApiError } from "./errors";
import { buildQuery, request } from "./request";

type Query = Parameters<typeof buildQuery>[0];

// ─── Refresh (single flight) ─────────────────────────────────

export type RefreshResult = "ok" | "unauthorized" | "network";
let refreshing: Promise<RefreshResult> | null = null;

/** Rotates the httpOnly refresh cookie and stores the new access token in memory. */
export function refreshSession(): Promise<RefreshResult> {
  if (refreshing) return refreshing;
  refreshing = (async (): Promise<RefreshResult> => {
    try {
      const data = await request<CustomerAuthResponse>(`${PUBLIC_API_URL}/auth/customer/refresh`, {
        method: "POST",
        credentials: "include",
      });
      sessionSnapshot().set(data.accessToken, data.expiresIn, data.customer);
      return "ok";
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return "unauthorized";
      return "network";
    } finally {
      setTimeout(() => {
        refreshing = null;
      }, 0);
    }
  })();
  return refreshing;
}

// ─── Requests ────────────────────────────────────────────────

type AuthedInit = RequestInit & { query?: Query; body?: BodyInit | null; json?: unknown };

/**
 * Request that sends the customer's access token when signed in. On 401 it refreshes once and
 * retries; if the refresh fails the session is cleared and marked as expired.
 */
export async function authedRequest<T>(path: string, init: AuthedInit = {}, retried = false): Promise<T> {
  const { query, json, ...rest } = init;
  const token = sessionSnapshot().accessToken;
  try {
    return await request<T>(`${PUBLIC_API_URL}${path}${buildQuery(query)}`, {
      cache: "no-store",
      ...rest,
      ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...rest.headers },
    });
  } catch (e) {
    if (!retried && e instanceof ApiError && e.status === 401 && token) {
      const result = await refreshSession();
      if (result === "ok") return authedRequest<T>(path, init, true);
      if (result === "unauthorized") sessionSnapshot().clear({ expired: true });
    }
    throw e;
  }
}

/** Downloads a binary (PDF) response as a Blob, with the same auth/refresh behaviour. */
export async function authedBlob(path: string, init: AuthedInit = {}, retried = false): Promise<Blob> {
  const { json, query, ...rest } = init;
  const token = sessionSnapshot().accessToken;
  let res: Response;
  try {
    res = await fetch(`${PUBLIC_API_URL}${path}${buildQuery(query)}`, {
      cache: "no-store",
      ...rest,
      ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
      headers: {
        Accept: "application/pdf, application/json",
        ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...rest.headers,
      },
    });
  } catch {
    throw new ApiError(0, "Network error");
  }
  if (res.status === 401 && token && !retried) {
    const result = await refreshSession();
    if (result === "ok") return authedBlob(path, init, true);
    if (result === "unauthorized") sessionSnapshot().clear({ expired: true });
  }
  if (!res.ok) {
    let message = res.statusText || "Request failed";
    try {
      const body = (await res.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      // not JSON
    }
    throw new ApiError(res.status, message);
  }
  return res.blob();
}

export const authedApi = {
  get: <T>(path: string, query?: Query) => authedRequest<T>(path, { method: "GET", query }),
  post: <T>(path: string, json?: unknown) => authedRequest<T>(path, { method: "POST", json: json ?? {} }),
  patch: <T>(path: string, json?: unknown) => authedRequest<T>(path, { method: "PATCH", json: json ?? {} }),
  delete: <T>(path: string) => authedRequest<T>(path, { method: "DELETE" }),
};
