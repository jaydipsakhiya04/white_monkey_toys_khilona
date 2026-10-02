function parseUrl(u: string | undefined): URL | null {
  if (!u) return null;
  try {
    return new URL(u);
  } catch {
    return null;
  }
}

const apiOrigin = parseUrl(process.env.NEXT_PUBLIC_API_URL);

const extraHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean)
  .map((h) => (h.includes("://") ? (parseUrl(h)?.hostname ?? h) : h));

const allowedHosts = new Set([...(apiOrigin ? [apiOrigin.hostname] : []), ...extraHosts]);

/** Make relative upload paths absolute against the API origin. */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:")) return url;
  if (url.startsWith("/") && apiOrigin) return `${apiOrigin.origin}${url}`;
  return url;
}

/**
 * Whether next/image may run this URL through the optimizer.
 * Hosts not configured in remotePatterns are rendered unoptimized instead of throwing.
 */
export function canOptimize(url: string): boolean {
  if (url.startsWith("data:")) return false;
  const u = parseUrl(url);
  return u ? allowedHosts.has(u.hostname) : false;
}
