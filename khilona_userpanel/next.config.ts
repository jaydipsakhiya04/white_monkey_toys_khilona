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

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  images: {
    remotePatterns: buildRemotePatterns(),
    formats: ["image/avif", "image/webp"],
  },
  /**
   * Optional same-origin API proxy: when API_PROXY_TARGET is set, `/_api/*` is
   * forwarded to the backend, so NEXT_PUBLIC_API_URL can be `<site>/_api`
   * (useful when the API's CORS allow-list doesn't include this origin).
   */
  async rewrites() {
    const target = process.env.API_PROXY_TARGET?.replace(/\/+$/, "");
    return target ? [{ source: "/_api/:path*", destination: `${target}/:path*` }] : [];
  },
};

export default nextConfig;
