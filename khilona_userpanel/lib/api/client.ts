import { PUBLIC_API_URL } from "@/lib/env";
import { buildQuery, request } from "./request";

type Query = Parameters<typeof buildQuery>[0];

/** Browser-side API helpers (used by TanStack Query hooks / mutations). */
export const api = {
  get<T>(path: string, query?: Query, init?: RequestInit) {
    return request<T>(`${PUBLIC_API_URL}${path}${buildQuery(query)}`, { ...init, method: "GET", cache: "no-store" });
  },
  post<T>(path: string, body: unknown, init?: RequestInit) {
    return request<T>(`${PUBLIC_API_URL}${path}`, { ...init, method: "POST", body: JSON.stringify(body) });
  },
};
