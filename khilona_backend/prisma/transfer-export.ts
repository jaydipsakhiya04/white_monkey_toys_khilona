/**
 * Exports the storefront data from this database to a JSON file, so a new server can start with
 * the same catalogue (used by deploy/push.sh, step "data").
 *
 *   npx tsx prisma/transfer-export.ts <out.json>
 *
 * Included: store settings, categories, live products (images, options, variants), banners.
 * Not included: admins (create a fresh one on the server), customers, orders, reviews, exchanges,
 * tokens, archived products. Image files live in ./uploads and are copied separately.
 */
import { config as loadEnv } from 'dotenv';
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

loadEnv({ quiet: true });
const prisma = new PrismaClient();

async function main() {
  const out = process.argv[2];
  if (!out) throw new Error('Usage: tsx prisma/transfer-export.ts <out.json>');

  const products = await prisma.product.findMany({ where: { deletedAt: null } });
  const productIds = products.map((p) => p.id);
  const options = await prisma.productOption.findMany({ where: { productId: { in: productIds } } });
  const variants = await prisma.productVariant.findMany({ where: { productId: { in: productIds } } });

  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    stores: await prisma.store.findMany(),
    categories: await prisma.category.findMany({ orderBy: [{ parentId: { sort: 'asc', nulls: 'first' } }] }),
    products,
    productImages: await prisma.productImage.findMany({ where: { productId: { in: productIds } } }),
    productOptions: options,
    productOptionValues: await prisma.productOptionValue.findMany({ where: { optionId: { in: options.map((o) => o.id) } } }),
    productVariants: variants,
    productVariantOptionValues: await prisma.productVariantOptionValue.findMany({ where: { variantId: { in: variants.map((v) => v.id) } } }),
    banners: await prisma.banner.findMany(),
  };
  writeFileSync(out, JSON.stringify(data));
  const counts = Object.fromEntries(Object.entries(data).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, (v as unknown[]).length]));
  console.log('Exported', counts);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
