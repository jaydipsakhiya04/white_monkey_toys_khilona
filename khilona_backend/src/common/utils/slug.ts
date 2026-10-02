/**
 * Converts text into an SEO-friendly, URL-safe slug.
 *   "Remote Control Car" -> "remote-control-car"
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\+/g, ' plus ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

/**
 * Returns a slug that is unique according to `exists`, appending -2, -3… when needed.
 */
export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
  fallback = 'item',
): Promise<string> {
  const root = slugify(base) || fallback;
  if (!(await exists(root))) return root;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${root}-${i}`;
    if (!(await exists(candidate))) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}
