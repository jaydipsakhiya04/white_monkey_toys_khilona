const trimSlash = (s: string) => s.replace(/\/+$/, "");

/** Public API base URL (used in the browser). */
export const PUBLIC_API_URL = trimSlash(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api");

/** API base URL used by server components (internal URL if provided). */
export function getServerApiUrl(): string {
  return trimSlash(process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api");
}

/** Canonical site URL (no trailing slash). */
export const SITE_URL = trimSlash(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
