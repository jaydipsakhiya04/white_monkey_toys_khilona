/**
 * Imports a file made by transfer-export.ts into this (server) database.
 *
 *   npx tsx prisma/transfer-import.ts <in.json> --from http://localhost:4000/uploads --to https://api.example.com/uploads [--replace]
 *
 * - Image URLs are rewritten from `--from` to `--to` (the server's public uploads URL).
 * - Without --replace, rows that already exist (same id) are kept: safe to re-run.
 * - With --replace, the storefront tables (store, banners, catalogue) are emptied first. Only use
 *   it before the site has orders: products referenced by orders cannot be deleted.
 * - Product ratings start at zero (reviews are not copied).
 */
import { config as loadEnv } from 'dotenv';
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

loadEnv({ quiet: true });
const prisma = new PrismaClient();

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
}

/** Dates arrive as ISO strings in JSON; Prisma accepts them as-is for DateTime fields. */
type Row = Record<string, unknown>;

async function main() {
  const file = process.argv[2];
  const from = arg('--from');
  const to = arg('--to');
  if (!file || file.startsWith('--')) throw new Error('Usage: tsx prisma/transfer-import.ts <in.json> --from <old uploads url> --to <new uploads url> [--replace]');

  let raw = readFileSync(file, 'utf8');
  if (from && to) raw = raw.split(from.replace(/\/+$/, '')).join(to.replace(/\/+$/, ''));
  const data = JSON.parse(raw) as Record<string, Row[]>;

  if (process.argv.includes('--replace')) {
    await prisma.$transaction([
      prisma.productVariantOptionValue.deleteMany(),
      prisma.productVariant.deleteMany(),
      prisma.productOptionValue.deleteMany(),
      prisma.productOption.deleteMany(),
      prisma.productImage.deleteMany(),
      prisma.product.deleteMany(),
      prisma.category.updateMany({ data: { parentId: null } }),
      prisma.category.deleteMany(),
      prisma.banner.deleteMany(),
      prisma.store.deleteMany(),
    ]);
    console.log('  • emptied store, banners and catalogue');
  }

  // one store row: the exported settings replace the default row the API creates on first access
  const store = data.stores?.[0];
  if (store) {
    const existing = await prisma.store.findFirst();
    if (existing && existing.id !== store.id) await prisma.store.delete({ where: { id: existing.id } });
    await prisma.store.upsert({ where: { id: store.id as string }, create: store as never, update: store as never });
  }

  // parents before sub-categories
  const categories = [...(data.categories ?? [])].sort((a, b) => Number(!!a.parentId) - Number(!!b.parentId));
  const steps: [string, Row[], (rows: Row[]) => Promise<{ count: number }>][] = [
    ['categories', categories, (rows) => prisma.category.createMany({ data: rows as never, skipDuplicates: true })],
    [
      'products',
      (data.products ?? []).map((p) => ({ ...p, ratingAvg: 0, ratingCount: 0 })),
      (rows) => prisma.product.createMany({ data: rows as never, skipDuplicates: true }),
    ],
    ['product images', data.productImages ?? [], (rows) => prisma.productImage.createMany({ data: rows as never, skipDuplicates: true })],
    ['product options', data.productOptions ?? [], (rows) => prisma.productOption.createMany({ data: rows as never, skipDuplicates: true })],
    ['option values', data.productOptionValues ?? [], (rows) => prisma.productOptionValue.createMany({ data: rows as never, skipDuplicates: true })],
    ['variants', data.productVariants ?? [], (rows) => prisma.productVariant.createMany({ data: rows as never, skipDuplicates: true })],
    ['variant values', data.productVariantOptionValues ?? [], (rows) => prisma.productVariantOptionValue.createMany({ data: rows as never, skipDuplicates: true })],
    ['banners', data.banners ?? [], (rows) => prisma.banner.createMany({ data: rows as never, skipDuplicates: true })],
  ];
  for (const [label, rows, insert] of steps) {
    if (!rows.length) continue;
    const { count } = await insert(rows);
    console.log(`  ✓ ${label}: ${count} added${count < rows.length ? ` (${rows.length - count} already present)` : ''}`);
  }
  console.log(`  ✓ store settings${store ? '' : ' (none in file)'}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
