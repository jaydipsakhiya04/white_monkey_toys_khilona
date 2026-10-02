import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";
import { getSitemapData } from "@/services/catalog.server";

// Generated per request (cached data) so builds never depend on the API being up.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/categories`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    ...["shipping", "returns", "privacy", "terms"].map((t) => ({
      url: `${SITE_URL}/policies/${t}`,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];

  try {
    const data = await getSitemapData();
    return [
      ...staticRoutes,
      ...data.categories.map((c) => ({
        url: `${SITE_URL}/category/${c.slug}`,
        lastModified: new Date(c.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...data.products.map((p) => ({
        url: `${SITE_URL}/product/${p.slug}`,
        lastModified: new Date(p.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
