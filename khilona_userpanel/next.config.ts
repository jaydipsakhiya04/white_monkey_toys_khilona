import type { NextConfig } from "next";

type RemotePattern = {
  protocol?: "http" | "https";
  hostname: string;
  port?: string;
  pathname?: string;
};

/**
 * Build `images.remotePatterns` from the environment so no host is hardcoded:
 *  - the origin of NEXT_PUBLIC_API_URL / API_URL (backend serves /uploads/...)
 *  - any extra hosts listed in NEXT_PUBLIC_IMAGE_HOSTS (S3 bucket, CDN...)
 */
function buildRemotePatterns(): RemotePattern[] {
  const patterns: RemotePattern[] = [];
  const seen = new Set<string>();

  const add = (p: RemotePattern) => {
    const key = `${p.protocol ?? "*"}://${p.hostname}:${p.port ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    patterns.push(p);
  };

  for (const raw of [process.env.NEXT_PUBLIC_API_URL, process.env.API_URL]) {
    if (!raw) continue;
    try {
      const u = new URL(raw);
      add({
        protocol: u.protocol.replace(":", "") as "http" | "https",
        hostname: u.hostname,
        port: u.port || "",
        pathname: "/**",
      });
    } catch {
      // ignore malformed env value
    }
  }

  for (const host of (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "").split(",")) {
    const h = host.trim();
    if (!h) continue;
    if (h.includes("://")) {
      try {
        const u = new URL(h);
        add({
          protocol: u.protocol.replace(":", "") as "http" | "https",
          hostname: u.hostname,
          port: u.port || "",
          pathname: "/**",
        });
      } catch {
        // ignore
      }
    } else {
      add({ hostname: h, pathname: "/**" });
    }
  }
  return patterns;
}

function originOf(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  images: {
    remotePatterns: buildRemotePatterns(),
    // WebP only: AVIF encoding is several times slower on first request, for little gain on photos
    formats: ["image/webp"],
    // uploads never change under the same URL (new uploads get new names) — keep optimised copies 30 days
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1200, 1920],
  },
  async rewrites() {
    const rules: { source: string; destination: string }[] = [];
    /**
     * Product photos are requested as same-origin `/uploads/...` (see lib/images.ts) and proxied to
     * the API on the same machine, so the image optimizer never fetches them over the public
     * internet (that round trip was slow and timed out under load).
     */
    const uploadsOrigin = originOf(process.env.API_URL) ?? originOf(process.env.NEXT_PUBLIC_API_URL);
    if (uploadsOrigin) rules.push({ source: "/uploads/:path*", destination: `${uploadsOrigin}/uploads/:path*` });
    /**
     * Optional same-origin API proxy: when API_PROXY_TARGET is set, `/_api/*` is
     * forwarded to the backend, so NEXT_PUBLIC_API_URL can be `<site>/_api`
     * (useful when the API's CORS allow-list doesn't include this origin).
     */
    const target = process.env.API_PROXY_TARGET?.replace(/\/+$/, "");
    if (target) rules.push({ source: "/_api/:path*", destination: `${target}/:path*` });
    return rules;
  },
};

export default nextConfig;
