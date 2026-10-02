function trimSlash(v: string): string {
  return v.replace(/\/+$/, '');
}

export const API_URL = trimSlash(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');

export const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL
  ? trimSlash(process.env.NEXT_PUBLIC_STOREFRONT_URL)
  : null;

export function storefrontProductUrl(slug: string): string | null {
  return STOREFRONT_URL ? `${STOREFRONT_URL}/product/${slug}` : null;
}
