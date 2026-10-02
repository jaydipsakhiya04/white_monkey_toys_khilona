import { getServerApiUrl } from "@/lib/env";
import { buildQuery, request } from "./request";
import { ApiError } from "./errors";

type Query = Parameters<typeof buildQuery>[0];

export const REVALIDATE_SECONDS = 60;

/** Server-side GET with ISR-style data caching (`next.revalidate`). */
export function serverGet<T>(path: string, query?: Query, revalidate: number = REVALIDATE_SECONDS) {
  return request<T>(`${getServerApiUrl()}${path}${buildQuery(query)}`, {
    method: "GET",
    next: { revalidate },
  });
}

export type SafeResult<T> = { data: T; error: null } | { data: null; error: ApiError };

/** Never throws — lets pages render an error state when the API is down. */
export async function safe<T>(p: Promise<T>): Promise<SafeResult<T>> {
  try {
    return { data: await p, error: null };
  } catch (e) {
    return { data: null, error: e instanceof ApiError ? e : new ApiError(0, "Unexpected error") };
  }
}
