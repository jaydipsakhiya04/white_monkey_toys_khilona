/**
 * Generates the home page offer banners from the store's own product photos and adds them to the
 * slider (Admin → Banners).
 *
 *   npm run banners:generate            # create missing banners (matched by title)
 *   npm run banners:generate -- --force # re-render images of existing generated banners too
 *
 * Each banner is drawn on a light canvas so white product-photo backgrounds blend away (multiply),
 * with a dark curved panel on the left (desktop) / bottom (phone) where the slide text sits. Title,
 * subtitle, link and button are stored as banner fields, so they stay editable in the admin panel.
 */
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import { loadConfig } from '../src/config/configuration';
import { LocalStorageProvider } from '../src/uploads/storage/local-storage.provider';
import { S3StorageProvider } from '../src/uploads/storage/s3-storage.provider';
import { StorageProvider } from '../src/uploads/storage/storage.provider';

loadEnv({ quiet: true });

const prisma = new PrismaClient();
const config = loadConfig();
const storage: StorageProvider =
  config.storage.provider === 's3'
    ? new S3StorageProvider(config.storage)
    : new LocalStorageProvider(config.storage.localDir, config.storage.publicUrl);
const force = process.argv.includes('--force');
/** Render only (to BANNER_PREVIEW_DIR); nothing is uploaded or saved. */
const preview = process.argv.includes('--preview');

interface BannerSpec {
  key: string;
  title: string;
  subtitle: string;
  linkUrl: string;
  ctaLabel: string;
  /** product slugs, the first is the hero product */
  products: string[];
  panel: string;
  /** light canvas tint */
  canvas: string;
  accent: string;
}

const BANNERS: BannerSpec[] = [
  {
    key: 'hobby-grade-rc-season',
    title: 'Hobby-Grade RC Season',
    subtitle: 'Brushless monsters and scale crawlers built for real off-road fun.',
    linkUrl: '/category/hobby-grade-rc-cars',
    ctaLabel: 'Shop hobby RC',
    products: ['suzuki-jimny-rc-crawler', 'bronco-style-rc-scale-crawler'],
    panel: '#111111',
    canvas: '#f4f2ee',
    accent: '#e85d2a',
  },
  {
    key: 'premium-rc-supercars',
    title: 'Premium RC Supercars',
    subtitle: 'Licensed Mercedes-AMG, Porsche and Ferrari replicas with full-function remotes.',
    linkUrl: '/category/premium-rc-cars',
    ctaLabel: 'Explore supercars',
    products: ['mercedes-amg-gt2-rc-car', 'porsche-911-dakar-rc-car'],
    panel: '#5c1414',
    canvas: '#f6f1ef',
    accent: '#f2b8a2',
  },
  {
    key: 'build-big-dig-deep',
    title: 'Build Big. Dig Deep.',
    subtitle: 'Working RC excavators, tippers and mixers that dig, tip and lift.',
    linkUrl: '/category/construction-rc',
    ctaLabel: 'Shop construction RC',
    products: ['rc-excavator-yellow', 'rc-mining-dump-truck'],
    panel: '#2b2111',
    canvas: '#f6f2e8',
    accent: '#f5b324',
  },
  {
    key: 'take-play-to-the-sky',
    title: 'Take Play to the Sky',
    subtitle: 'Camera drones, LED flyers, helicopters and RC planes for every pilot.',
    linkUrl: '/category/drones-and-rc-aircraft',
    ctaLabel: 'Shop drones',
    products: ['rc-helicopter-with-camera', 'led-glow-drone'],
    panel: '#0d1b33',
    canvas: '#eef2f6',
    accent: '#5fb4ff',
  },
  {
    key: 'heroes-have-landed',
    title: 'Heroes Have Landed',
    subtitle: 'Marvel and Star Wars figures for young fans and serious collectors.',
    linkUrl: '/category/action-figures',
    ctaLabel: 'Meet the heroes',
    products: ['star-wars-mandalorian-din-djarin-figure', 'marvel-miles-morales-action-figure'],
    panel: '#1a1030',
    canvas: '#f3f1f6',
    accent: '#ff5a4e',
  },
  {
    key: 'pro-hobby-picks-14-plus',
    title: 'Pro Hobby Picks · 14+',
    subtitle: 'Fast, tough RC for teens and grown-up hobbyists.',
    linkUrl: '/products?age=14-plus-years',
    ctaLabel: 'Shop 14+',
    products: ['hoshi-4wd-rc-monster-truck-orange', 'scale-rc-crawler-truck-grey'],
    panel: '#141414',
    canvas: '#f3f3f1',
    accent: '#ff8a3d',
  },
  {
    key: 'pan-india-delivery',
    title: 'PAN India Delivery',
    subtitle: 'Wholesale and retailer orders shipped to toy shops across India.',
    linkUrl: '/wholesale#enquiry',
    ctaLabel: 'Send an enquiry',
    products: ['rc-flatbed-low-loader-truck', 'rc-articulated-dump-truck'],
    panel: '#0c3634',
    canvas: '#eff4f2',
    accent: '#7fd8c8',
  },
  {
    key: 'retailer-wholesale-prices',
    title: 'Retailer & Wholesale Prices',
    subtitle: 'Stock your shop with RC cars, drones and figures from Surat.',
    linkUrl: '/wholesale',
    ctaLabel: 'Get a quote',
    products: ['rc-scania-770-tractor-head', 'rc-excavator-grey-yellow'],
    panel: '#111111',
    canvas: '#f5f3ef',
    accent: '#e85d2a',
  },
];

// ─── Rendering ───────────────────────────────────────────────

const DESKTOP = { w: 1680, h: 480 };
const MOBILE = { w: 1000, h: 800 };

/** Product photo, trimmed to its content, scaled to a target height (max width). */
async function productImage(slug: string, height: number, maxWidth: number) {
  const product = await prisma.product.findFirst({ where: { slug, deletedAt: null }, select: { thumbnailUrl: true } });
  if (!product?.thumbnailUrl) throw new Error(`No photo for product "${slug}"`);
  const rel = product.thumbnailUrl.replace(/^.*?\/uploads\//, '');
  const file = resolve(config.storage.localDir, rel);
  const source = existsSync(file) ? file : Buffer.from(await (await fetch(product.thumbnailUrl)).arrayBuffer());
  const trimmed = await sharp(source).flatten({ background: '#ffffff' }).trim({ threshold: 18 }).toBuffer();
  const buf = await sharp(trimmed).resize({ height, width: maxWidth, fit: 'inside' }).toBuffer();
  const meta = await sharp(buf).metadata();
  return { buf, w: meta.width!, h: meta.height! };
}

const shadow = (cx: number, cy: number, rx: number) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${Math.round(rx * 0.12)}" fill="#000" opacity="0.16" filter="url(#blur)"/>`;

/** Lays out up to three products: hero in the middle, two flanking ones slightly smaller. */
async function cluster(spec: BannerSpec, area: { x: number; y: number; w: number; h: number }, scale = 1) {
  // hero on the right, a smaller companion on the left (drawn behind)
  const slots = [
    { cx: 0.64, h: 0.92, base: 0.96, maxW: 0.6 },
    { cx: 0.22, h: 0.7, base: 0.97, maxW: 0.42 },
  ];
  const placed: { input: Buffer; left: number; top: number; blend: 'multiply' }[] = [];
  const shadows: string[] = [];
  for (const [i, slug] of spec.products.slice(0, 2).entries()) {
    const s = slots[i];
    const img = await productImage(slug, Math.round(area.h * s.h * scale), Math.round(area.w * s.maxW));
    const cx = area.x + area.w * s.cx;
    const bottom = area.y + area.h * s.base;
    const left = Math.round(cx - img.w / 2);
    const top = Math.round(bottom - img.h);
    placed.push({ input: img.buf, left, top, blend: 'multiply' });
    shadows.push(shadow(Math.round(cx), Math.round(bottom - 4), Math.round(img.w * 0.42)));
  }
  // draw the flanking products first so the hero sits in front
  return { products: [placed[1], placed[0]].filter(Boolean), shadows };
}

function dots(x: number, y: number, w: number, h: number, color: string) {
  return `<pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="${color}" opacity="0.13"/></pattern>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#dots)"/>`;
}

async function renderDesktop(spec: BannerSpec) {
  const { w, h } = DESKTOP;
  const edgeTop = 800;
  const edgeBottom = 690;
  const backdrop = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="9"/></filter>
    </defs>
    <rect width="${w}" height="${h}" fill="${spec.canvas}"/>
    <circle cx="1240" cy="250" r="330" fill="url(#glow)"/>
    <circle cx="1240" cy="250" r="300" fill="none" stroke="#000" stroke-opacity="0.05"/>
    <circle cx="1240" cy="250" r="380" fill="none" stroke="#000" stroke-opacity="0.04" stroke-dasharray="4 8"/>
  </svg>`;
  const { products, shadows } = await cluster(spec, { x: 850, y: 24, w: 790, h: 444 });
  const shadowSvg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><defs><filter id="blur"><feGaussianBlur stdDeviation="9"/></filter></defs>${shadows.join('')}</svg>`;
  const panel = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="pglow" cx="0%" cy="100%" r="80%"><stop offset="0" stop-color="${spec.accent}" stop-opacity="0.2"/><stop offset="1" stop-color="${spec.accent}" stop-opacity="0"/></radialGradient>
      <clipPath id="clip"><path d="M0 0 H${edgeTop} C ${edgeTop - 40} ${h * 0.45}, ${edgeBottom + 40} ${h * 0.6}, ${edgeBottom} ${h} H0 Z"/></clipPath>
    </defs>
    <g clip-path="url(#clip)">
      <rect width="${w}" height="${h}" fill="${spec.panel}"/>
      <rect width="${w}" height="${h}" fill="url(#pglow)"/>
      ${dots(0, 0, edgeTop, h, '#ffffff')}
      <circle cx="${edgeTop - 120}" cy="-40" r="170" fill="#fff" opacity="0.04"/>
    </g>
    <path d="M${edgeTop + 18} 0 C ${edgeTop - 22} ${h * 0.45}, ${edgeBottom + 58} ${h * 0.6}, ${edgeBottom + 18} ${h}" fill="none" stroke="${spec.accent}" stroke-width="5" stroke-linecap="round"/>
  </svg>`;
  return sharp(Buffer.from(backdrop))
    .composite([{ input: Buffer.from(shadowSvg) }, ...products, { input: Buffer.from(panel) }])
    .webp({ quality: 86 })
    .toBuffer();
}

async function renderMobile(spec: BannerSpec) {
  const { w, h } = MOBILE;
  const backdrop = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
    <rect width="${w}" height="${h}" fill="${spec.canvas}"/>
    <circle cx="${w / 2}" cy="220" r="300" fill="url(#glow)"/>
    <circle cx="${w / 2}" cy="220" r="270" fill="none" stroke="#000" stroke-opacity="0.05"/>
  </svg>`;
  const { products, shadows } = await cluster(spec, { x: 30, y: 16, w: 940, h: 420 });
  const shadowSvg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><defs><filter id="blur"><feGaussianBlur stdDeviation="9"/></filter></defs>${shadows.join('')}</svg>`;
  const top = 420;
  const panel = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="pglow" cx="100%" cy="100%" r="90%"><stop offset="0" stop-color="${spec.accent}" stop-opacity="0.2"/><stop offset="1" stop-color="${spec.accent}" stop-opacity="0"/></radialGradient>
      <clipPath id="clip"><path d="M0 ${top + 30} C ${w * 0.3} ${top - 20}, ${w * 0.7} ${top + 60}, ${w} ${top} V${h} H0 Z"/></clipPath>
    </defs>
    <g clip-path="url(#clip)">
      <rect width="${w}" height="${h}" fill="${spec.panel}"/>
      <rect width="${w}" height="${h}" fill="url(#pglow)"/>
      ${dots(0, top - 40, w, h, '#ffffff')}
    </g>
    <path d="M0 ${top + 12} C ${w * 0.3} ${top - 38}, ${w * 0.7} ${top + 42}, ${w} ${top - 18}" fill="none" stroke="${spec.accent}" stroke-width="6" stroke-linecap="round"/>
  </svg>`;
  return sharp(Buffer.from(backdrop))
    .composite([{ input: Buffer.from(shadowSvg) }, ...products, { input: Buffer.from(panel) }])
    .webp({ quality: 84 })
    .toBuffer();
}

// ─── Import ──────────────────────────────────────────────────

async function main() {
  const out = process.env.BANNER_PREVIEW_DIR;
  let created = 0;
  let updated = 0;
  for (const [i, spec] of BANNERS.entries()) {
    const existing = await prisma.banner.findFirst({ where: { title: spec.title } });
    if (existing && !force && !preview) {
      console.log(`  • ${spec.title} already exists`);
      continue;
    }
    const [desktop, mobile] = await Promise.all([renderDesktop(spec), renderMobile(spec)]);
    if (out) {
      await sharp(desktop).png().toFile(resolve(out, `${spec.key}.png`));
      await sharp(mobile).png().toFile(resolve(out, `${spec.key}-mobile.png`));
    }
    if (preview) {
      console.log(`  ◦ previewed ${spec.title}`);
      continue;
    }
    const stamp = Date.now().toString(36);
    const imageUrl = (await storage.put(`banners/generated/${spec.key}-${stamp}.webp`, desktop, 'image/webp')).url;
    const mobileImageUrl = (await storage.put(`banners/generated/${spec.key}-mobile-${stamp}.webp`, mobile, 'image/webp')).url;
    const data = { title: spec.title, subtitle: spec.subtitle, linkUrl: spec.linkUrl, ctaLabel: spec.ctaLabel, imageUrl, mobileImageUrl };
    if (existing) {
      await prisma.banner.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.banner.create({ data: { ...data, isActive: true, sortOrder: i } });
      created++;
    }
    console.log(`  ✓ ${spec.title}`);
  }
  console.log(`\nDone: ${created} created, ${updated} re-rendered. Manage them in Admin → Banners.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
