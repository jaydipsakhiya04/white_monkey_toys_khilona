import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { CATALOG_CACHE_TAG } from "@/lib/api/server";

/**
 * Called by the API after admin changes to store settings, banners, products or categories, so
 * the storefront shows them immediately (e.g. a removed cover image) instead of after the cache
 * period. Protected by the shared REVALIDATE_SECRET (= STOREFRONT_REVALIDATE_SECRET in the API).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  revalidateTag(CATALOG_CACHE_TAG);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, revalidatedAt: new Date().toISOString() });
}
