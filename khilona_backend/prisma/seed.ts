/**
 * Development seed for Khilona.
 *
 *   npm run seed
 *
 * Idempotent: existing admins/categories/products (matched by email/slug) are left untouched,
 * so it is safe to run repeatedly. Demo orders are only created when the database has no orders
 * and NODE_ENV is not "production" (disable with SEED_DEMO_ORDERS=false).
 *
 * ⚠️  The admin credentials below are for local development ONLY. Change them before production.
 */
import { config as loadEnv } from 'dotenv';
import { AdminRole, OrderStatus, Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import sharp from 'sharp';
import { loadConfig } from '../src/config/configuration';
import { compactDateInZone } from '../src/common/utils/time';
import { recomputeProductAggregates, resolvePrice, resolveVariantPrice } from '../src/products/pricing';
import { LocalStorageProvider } from '../src/uploads/storage/local-storage.provider';
import { S3StorageProvider } from '../src/uploads/storage/s3-storage.provider';
import { StorageProvider } from '../src/uploads/storage/storage.provider';
import { ArtKind, BACKGROUNDS, heroSvg, logoSvg, productSvg } from './seed-art';

loadEnv({ quiet: true });

const prisma = new PrismaClient();
const config = loadConfig();
const storage: StorageProvider =
  config.storage.provider === 's3'
    ? new S3StorageProvider(config.storage)
    : new LocalStorageProvider(config.storage.localDir, config.storage.publicUrl);

export const DEV_ADMINS = [
  { name: 'Khilona Owner', email: 'admin@khilona.in', password: 'Admin@12345', role: AdminRole.SUPER_ADMIN, phone: '9876543210' },
  { name: 'Store Staff', email: 'staff@khilona.in', password: 'Staff@12345', role: AdminRole.ADMIN, phone: '9876501234' },
];

async function render(svg: string, key: string, width = 800): Promise<string> {
  const buffer = await sharp(Buffer.from(svg)).resize({ width }).webp({ quality: 86 }).toBuffer();
  return (await storage.put(`seed/${key}.webp`, buffer, 'image/webp')).url;
}

// ─── Catalogue data ──────────────────────────────────────────

interface SeedCategory {
  slug: string;
  name: string;
  description: string;
  kind: ArtKind;
  color: string;
  parent?: string;
}

const CATEGORIES: SeedCategory[] = [
  { slug: 'toys', name: 'Toys', description: 'Everyday play favourites — cars, cuddly friends and building sets that spark imagination.', kind: 'teddy', color: '#C68B59' },
  { slug: 'cars-and-vehicles', name: 'Cars & Vehicles', description: 'Remote control cars, die-cast sets and push-along trains for little racers.', kind: 'car', color: '#E4572E', parent: 'toys' },
  { slug: 'dolls-and-soft-toys', name: 'Dolls & Soft Toys', description: 'Huggable teddies, plush animals and dolls with accessories.', kind: 'teddy', color: '#D9A066', parent: 'toys' },
  { slug: 'building-and-construction', name: 'Building & Construction', description: 'Blocks and magnetic tiles that build creativity, one piece at a time.', kind: 'blocks', color: '#7B6CF6', parent: 'toys' },
  { slug: 'learning-and-educational', name: 'Learning & Educational', description: 'STEM kits, wooden learning toys and science sets that make learning fun.', kind: 'flask', color: '#33B679' },
  { slug: 'games-and-puzzles', name: 'Games & Puzzles', description: 'Family board games and puzzles for game nights and quiet afternoons.', kind: 'board', color: '#0F8B8D' },
  { slug: 'board-games', name: 'Board Games', description: 'Classic and modern board games the whole family can play together.', kind: 'board', color: '#0F8B8D', parent: 'games-and-puzzles' },
  { slug: 'puzzles', name: 'Puzzles', description: 'Jigsaws, cubes and brain teasers for every age.', kind: 'puzzle', color: '#7B6CF6', parent: 'games-and-puzzles' },
  { slug: 'outdoor-and-sports', name: 'Outdoor & Sports', description: 'Cricket sets, kites and bubble fun for sunny days outside.', kind: 'kite', color: '#E4572E' },
  { slug: 'baby-and-toddler', name: 'Baby & Toddler', description: 'Safe, colourful first toys for babies and toddlers.', kind: 'rings', color: '#000000' },
  { slug: 'arts-and-crafts', name: 'Arts & Crafts', description: 'Crayons, clay and craft kits for young artists.', kind: 'crayons', color: '#000000' },
];

interface SeedVariant {
  options: Record<string, string>;
  sku: string;
  stock: number;
  price?: number;
  salePrice?: number;
  color?: string;
}

interface SeedProduct {
  name: string;
  slug: string;
  category: string;
  kind: ArtKind;
  color: string;
  sku: string;
  price: number;
  salePrice?: number;
  stock: number;
  short: string;
  description: string;
  specs: [string, string][];
  featured?: boolean;
  active?: boolean;
  options?: { name: string; values: string[] }[];
  variants?: SeedVariant[];
}

const PRODUCTS: SeedProduct[] = [
  {
    name: 'Turbo Racer Remote Control Car', slug: 'turbo-racer-remote-control-car', category: 'cars-and-vehicles', kind: 'car', color: '#E4572E',
    sku: 'KH-RC-TURBO', price: 1499, salePrice: 1199, stock: 0, featured: true,
    short: '2.4 GHz high-speed RC car with rechargeable battery and rubber grip tyres.',
    description: 'Zoom across floors and driveways with the Turbo Racer. Its 2.4 GHz controller lets multiple cars race together without interference, while the shock-absorbing body handles bumps with ease.\n\nThe rechargeable battery gives around 25 minutes of play per charge, and the soft rubber tyres grip tiles, wood and short grass. A great first remote control car for ages 6 and up.',
    specs: [['Recommended age', '6 years +'], ['Battery', 'Rechargeable Li-ion, USB charging'], ['Play time', '~25 minutes per charge'], ['Range', 'Up to 30 metres'], ['Material', 'ABS plastic, rubber tyres']],
    options: [{ name: 'Color', values: ['Red', 'Blue', 'Black'] }],
    variants: [
      { options: { Color: 'Red' }, sku: 'KH-RC-TURBO-RED', stock: 9, color: '#E4572E' },
      { options: { Color: 'Blue' }, sku: 'KH-RC-TURBO-BLU', stock: 6, color: '#3B6FE0' },
      { options: { Color: 'Black' }, sku: 'KH-RC-TURBO-BLK', stock: 3, price: 1599, salePrice: 1299, color: '#2A2838' },
    ],
  },
  {
    name: 'Die-Cast Metal Car Set (Pack of 6)', slug: 'die-cast-metal-car-set-pack-of-6', category: 'cars-and-vehicles', kind: 'car', color: '#0F8B8D',
    sku: 'KH-DC-SET6', price: 699, salePrice: 549, stock: 24,
    short: 'Six pull-back die-cast cars with opening doors and detailed paint.',
    description: 'A collector-worthy set of six pull-back cars made from die-cast metal. Pull back, let go and watch them race. Sturdy enough for everyday play and detailed enough for the display shelf.',
    specs: [['Recommended age', '3 years +'], ['Pieces', '6 cars'], ['Material', 'Die-cast metal & plastic'], ['Size', 'Approx. 1:43 scale']],
  },
  {
    name: 'Wooden Push-Along Train Set', slug: 'wooden-push-along-train-set', category: 'cars-and-vehicles', kind: 'train', color: '#E4572E',
    sku: 'KH-WD-TRAIN', price: 899, stock: 14, featured: true,
    short: 'Classic wooden engine and carriage with magnetic couplings.',
    description: 'A timeless wooden train with smooth-rolling wheels and magnetic couplings that little hands can connect on their own. Finished with child-safe, non-toxic paints.',
    specs: [['Recommended age', '2 years +'], ['Material', 'Sustainably sourced wood'], ['Finish', 'Non-toxic water-based paint'], ['Pieces', 'Engine + 1 carriage']],
  },
  {
    name: 'Monster Truck Friction Car', slug: 'monster-truck-friction-car', category: 'cars-and-vehicles', kind: 'truck', color: '#33B679',
    sku: 'KH-MT-FRIC', price: 449, salePrice: 399, stock: 32,
    short: 'Chunky friction-powered monster truck — no batteries needed.',
    description: 'Push it forward a few times and let it go! The friction motor powers this chunky monster truck over rugs and ramps. Oversized wheels and a tough body make it perfect for rough play.',
    specs: [['Recommended age', '3 years +'], ['Power', 'Friction motor (no batteries)'], ['Material', 'Durable ABS plastic']],
  },
  {
    name: 'Cuddly Teddy Bear', slug: 'cuddly-teddy-bear', category: 'dolls-and-soft-toys', kind: 'teddy', color: '#C68B59',
    sku: 'KH-TED-CUD', price: 499, stock: 0, featured: true,
    short: 'Super-soft teddy with a satin bow — the perfect gift for every age.',
    description: 'Made from ultra-soft, hypoallergenic plush with a sewn-on face (no small parts), this teddy is a forever friend. Available in three sizes, from bedtime buddy to giant hug.',
    specs: [['Recommended age', 'All ages (0+)'], ['Material', 'Hypoallergenic plush, polyester fibre filling'], ['Care', 'Surface wash only']],
    options: [{ name: 'Size', values: ['Small (30 cm)', 'Medium (45 cm)', 'Large (60 cm)'] }],
    variants: [
      { options: { Size: 'Small (30 cm)' }, sku: 'KH-TED-CUD-S', stock: 15, price: 499 },
      { options: { Size: 'Medium (45 cm)' }, sku: 'KH-TED-CUD-M', stock: 10, price: 799, salePrice: 699 },
      { options: { Size: 'Large (60 cm)' }, sku: 'KH-TED-CUD-L', stock: 4, price: 1199, salePrice: 999 },
    ],
  },
  {
    name: 'Fashion Doll with Accessories', slug: 'fashion-doll-with-accessories', category: 'dolls-and-soft-toys', kind: 'doll', color: '#EC4899',
    sku: 'KH-DOLL-FASH', price: 899, salePrice: 749, stock: 18,
    short: 'Poseable doll with 2 outfits, shoes and a handbag.',
    description: 'Mix and match outfits for every adventure. This poseable doll comes with two outfits, shoes, a handbag and a hairbrush for endless storytelling play.',
    specs: [['Recommended age', '3 years +'], ['Height', '30 cm'], ['In the box', 'Doll, 2 outfits, shoes, handbag, brush']],
  },
  {
    name: 'Plush Elephant Soft Toy', slug: 'plush-elephant-soft-toy', category: 'dolls-and-soft-toys', kind: 'elephant', color: '#9AA5C4',
    sku: 'KH-PLU-ELE', price: 599, stock: 11,
    short: 'Floppy-eared elephant made from velvety soft plush.',
    description: 'A gentle giant with floppy ears and a velvety coat. Safe for babies and loved by grown-ups too.',
    specs: [['Recommended age', 'All ages (0+)'], ['Height', '35 cm'], ['Material', 'Velboa plush']],
  },
  {
    name: 'Creative Building Blocks (250 pcs)', slug: 'creative-building-blocks-250-pcs', category: 'building-and-construction', kind: 'blocks', color: '#7B6CF6',
    sku: 'KH-BLK-250', price: 1299, salePrice: 999, stock: 26, featured: true,
    short: '250 colourful interlocking bricks with an idea booklet and storage tub.',
    description: 'Build houses, rockets, animals — anything they can imagine. 250 interlocking bricks in bright colours, compatible with major brick brands, packed in a reusable storage tub.',
    specs: [['Recommended age', '4 years +'], ['Pieces', '250'], ['Material', 'BPA-free ABS plastic'], ['Includes', 'Storage tub, idea booklet']],
  },
  {
    name: 'Magnetic Tiles Set (60 pieces)', slug: 'magnetic-tiles-set-60-pieces', category: 'building-and-construction', kind: 'tiles', color: '#FF8A3D',
    sku: 'KH-MAG-60', price: 2499, salePrice: 1999, stock: 0,
    short: 'Translucent magnetic tiles for 3D building and colour play.',
    description: 'Strong magnets and translucent colours make building 3D shapes magical. Includes squares and triangles to create towers, castles and more.',
    specs: [['Recommended age', '3 years +'], ['Pieces', '60'], ['Material', 'Food-grade ABS, encased magnets']],
  },
  {
    name: 'Kids Science Kit: Volcano & Crystals', slug: 'kids-science-kit-volcano-and-crystals', category: 'learning-and-educational', kind: 'flask', color: '#33B679',
    sku: 'KH-SCI-VOLC', price: 899, salePrice: 749, stock: 12,
    short: '12 hands-on experiments including an erupting volcano and crystal growing.',
    description: 'Turn your kitchen into a lab! Build an erupting volcano, grow sparkling crystals and discover the science behind each experiment with the illustrated guide.',
    specs: [['Recommended age', '8 years +'], ['Experiments', '12'], ['Adult supervision', 'Required']],
  },
  {
    name: 'Solar Robot Kit 12-in-1', slug: 'solar-robot-kit-12-in-1', category: 'learning-and-educational', kind: 'robot', color: '#9AA5C4',
    sku: 'KH-STEM-SOL12', price: 1499, salePrice: 1249, stock: 9, featured: true,
    short: 'Build 12 different solar-powered robots — no batteries required.',
    description: 'A STEM kit that teaches engineering and renewable energy. Assemble 12 different robots that crawl, roll and float, all powered by the included solar panel.',
    specs: [['Recommended age', '8 years +'], ['Builds', '12 robot models'], ['Power', 'Solar panel (included)']],
  },
  {
    name: 'Wooden Abacus Counting Frame', slug: 'wooden-abacus-counting-frame', category: 'learning-and-educational', kind: 'abacus', color: '#33B679',
    sku: 'KH-WD-ABACUS', price: 349, stock: 20,
    short: 'Colourful bead abacus for early counting and maths skills.',
    description: 'A classic learning tool that makes counting, addition and subtraction hands-on. Smooth wooden frame with brightly coloured beads.',
    specs: [['Recommended age', '3 years +'], ['Material', 'Wood'], ['Rows', '5 rows × 10 beads']],
    options: [{ name: 'Age', values: ['3+', '5+'] }],
    variants: [
      { options: { Age: '3+' }, sku: 'KH-WD-ABACUS-3', stock: 12 },
      { options: { Age: '5+' }, sku: 'KH-WD-ABACUS-5', stock: 8, price: 449 },
    ],
  },
  {
    name: 'Snakes & Ladders + Ludo 2-in-1', slug: 'snakes-and-ladders-ludo-2-in-1', category: 'board-games', kind: 'board', color: '#0F8B8D',
    sku: 'KH-BG-SNL', price: 299, stock: 40,
    short: 'Two classic family games on one sturdy folding board.',
    description: 'Two all-time favourites on a double-sided folding board. Includes dice and tokens for up to four players.',
    specs: [['Players', '2–4'], ['Recommended age', '4 years +'], ['Includes', 'Board, 16 tokens, 2 dice']],
  },
  {
    name: 'Business Trading Board Game', slug: 'business-trading-board-game', category: 'board-games', kind: 'board', color: '#E4572E',
    sku: 'KH-BG-TRADE', price: 799, salePrice: 649, stock: 16, featured: true,
    short: 'Buy, sell and trade cities in this classic family strategy game.',
    description: 'Roll the dice, buy properties in famous Indian cities and become the richest player. A great way to learn money skills while having fun together.',
    specs: [['Players', '2–6'], ['Recommended age', '8 years +'], ['Play time', '60–90 minutes']],
  },
  {
    name: 'Magnetic Folding Chess Set', slug: 'magnetic-folding-chess-set', category: 'board-games', kind: 'chess', color: '#8B5E3C',
    sku: 'KH-BG-CHESS', price: 549, stock: 3,
    short: 'Travel-friendly magnetic chess board with storage inside.',
    description: 'Magnetic pieces stay in place on car rides and picnics. The board folds into a case that stores all 32 pieces.',
    specs: [['Players', '2'], ['Recommended age', '6 years +'], ['Board size', '25 × 25 cm']],
  },
  {
    name: 'World Map Jigsaw Puzzle (500 pcs)', slug: 'world-map-jigsaw-puzzle-500-pcs', category: 'puzzles', kind: 'map', color: '#33B679',
    sku: 'KH-PZ-WMAP', price: 499, salePrice: 449, stock: 13,
    short: 'Illustrated world map jigsaw — learn geography while you play.',
    description: 'A beautifully illustrated world map featuring landmarks and animals from every continent. Thick, precision-cut pieces that fit snugly.',
    specs: [['Pieces', '500'], ['Recommended age', '10 years +'], ['Finished size', '48 × 34 cm']],
  },
  {
    name: 'Speed Cube 3×3', slug: 'speed-cube-3x3', category: 'puzzles', kind: 'cube', color: '#000000',
    sku: 'KH-PZ-CUBE3', price: 249, stock: 35,
    short: 'Smooth-turning stickerless puzzle cube for beginners and speedcubers.',
    description: 'A smooth, stickerless 3×3 cube with adjustable tension. Great for beginners learning their first solve and fast enough for timed practice.',
    specs: [['Recommended age', '6 years +'], ['Type', 'Stickerless 3×3'], ['Size', '56 mm']],
  },
  {
    name: 'Kids Cricket Set', slug: 'kids-cricket-set', category: 'outdoor-and-sports', kind: 'cricket', color: '#E2B26A',
    sku: 'KH-OUT-CRK', price: 999, stock: 0,
    short: 'Willow-style bat, stumps, bails and a soft ball — ready for the gully match.',
    description: 'Everything for a backyard match: a lightweight bat sized for young players, stumps with bails, and a soft tennis-style ball that is safe for play.',
    specs: [['Includes', 'Bat, 3 stumps, 2 bails, ball, carry bag'], ['Material', 'Kashmir willow-style wood']],
    options: [{ name: 'Bat Size', values: ['Size 3 (5–7 yrs)', 'Size 4 (8–10 yrs)', 'Size 5 (10–12 yrs)'] }],
    variants: [
      { options: { 'Bat Size': 'Size 3 (5–7 yrs)' }, sku: 'KH-OUT-CRK-3', stock: 7, price: 999, salePrice: 899 },
      { options: { 'Bat Size': 'Size 4 (8–10 yrs)' }, sku: 'KH-OUT-CRK-4', stock: 5, price: 1099, salePrice: 949 },
      { options: { 'Bat Size': 'Size 5 (10–12 yrs)' }, sku: 'KH-OUT-CRK-5', stock: 0, price: 1199 },
    ],
  },
  {
    name: 'Sky Dancer Kite (Pack of 2)', slug: 'sky-dancer-kite-pack-of-2', category: 'outdoor-and-sports', kind: 'kite', color: '#E4572E',
    sku: 'KH-OUT-KITE', price: 199, stock: 50,
    short: 'Easy-flying diamond kites with tails and 50 m string.',
    description: 'Lightweight, easy-to-launch diamond kites that fly in gentle breezes. Two kites in each pack, each with a 50 m string and winder.',
    specs: [['Recommended age', '5 years +'], ['Pack', '2 kites'], ['String', '50 m per kite']],
  },
  {
    name: 'Bubble Blaster Gun', slug: 'bubble-blaster-gun', category: 'outdoor-and-sports', kind: 'bubbles', color: '#FFC53D',
    sku: 'KH-OUT-BUBL', price: 599, salePrice: 499, stock: 22,
    short: 'Battery-powered bubble gun that blows hundreds of bubbles a minute.',
    description: 'Pull the trigger for a stream of shimmering bubbles. Comes with two bottles of non-toxic bubble solution.',
    specs: [['Recommended age', '3 years +'], ['Batteries', '3 × AA (not included)'], ['Includes', '2 × 100 ml bubble solution']],
  },
  {
    name: 'Musical Xylophone', slug: 'musical-xylophone', category: 'baby-and-toddler', kind: 'xylophone', color: '#000000',
    sku: 'KH-BB-XYLO', price: 449, stock: 17,
    short: 'Eight-note rainbow xylophone with two child-safe mallets.',
    description: 'Introduce little ones to music with tuned metal keys on a sturdy wooden base. Rounded mallets are easy to hold.',
    specs: [['Recommended age', '18 months +'], ['Notes', '8 tuned keys'], ['Material', 'Wood & metal']],
  },
  {
    name: 'Rainbow Stacking Rings', slug: 'rainbow-stacking-rings', category: 'baby-and-toddler', kind: 'rings', color: '#000000',
    sku: 'KH-BB-RINGS', price: 249, stock: 4,
    short: 'Classic stacking toy for colour, size and motor-skill learning.',
    description: 'Five colourful rings that stack in order of size, helping toddlers develop hand-eye coordination and recognise colours.',
    specs: [['Recommended age', '6 months +'], ['Material', 'BPA-free plastic']],
  },
  {
    name: 'Jumbo Crayons (24 Colours)', slug: 'jumbo-crayons-24-colours', category: 'arts-and-crafts', kind: 'crayons', color: '#000000',
    sku: 'KH-ART-CRAY24', price: 199, stock: 60,
    short: 'Thick, non-toxic crayons that are easy for small hands to grip.',
    description: 'Bright, smooth-colouring jumbo crayons made from non-toxic wax. Break-resistant and easy to grip.',
    specs: [['Recommended age', '2 years +'], ['Colours', '24'], ['Safety', 'Non-toxic, AP certified']],
  },
  {
    name: 'Soft Clay Dough Kit', slug: 'soft-clay-dough-kit', category: 'arts-and-crafts', kind: 'clay', color: '#7B6CF6',
    sku: 'KH-ART-CLAY', price: 299, stock: 0,
    short: 'Soft, non-sticky modelling dough with shape cutters.',
    description: 'Squish, roll and shape! This soft dough stays fresh in its tubs and comes with cutters and a roller.',
    specs: [['Recommended age', '3 years +'], ['Safety', 'Non-toxic, gluten-free']],
    options: [{ name: 'Pack', values: ['6 Colours', '12 Colours'] }],
    variants: [
      { options: { Pack: '6 Colours' }, sku: 'KH-ART-CLAY-6', stock: 14 },
      { options: { Pack: '12 Colours' }, sku: 'KH-ART-CLAY-12', stock: 9, price: 499, salePrice: 449 },
    ],
  },
  {
    name: 'Glow-in-the-Dark Ceiling Stars', slug: 'glow-in-the-dark-ceiling-stars', category: 'arts-and-crafts', kind: 'stars', color: '#9AE6B4',
    sku: 'KH-ART-STARS', price: 249, stock: 0, active: false,
    short: 'Coming soon — 100 self-adhesive glowing stars for bedroom ceilings.',
    description: 'Turn any room into a starry night sky. Restocking soon.',
    specs: [['Pieces', '100']],
  },
];

// ─── Seed steps ──────────────────────────────────────────────

async function seedAdmins() {
  for (const admin of DEV_ADMINS) {
    const exists = await prisma.admin.findUnique({ where: { email: admin.email } });
    if (exists) continue;
    await prisma.admin.create({
      data: {
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        passwordHash: await bcrypt.hash(admin.password, 12),
      },
    });
    console.log(`  ✓ admin ${admin.email}`);
  }
}

async function seedStore() {
  if (await prisma.store.findFirst()) {
    console.log('  • store exists, skipped');
    return;
  }
  const [logoUrl, coverImageUrl] = await Promise.all([
    render(logoSvg(), 'store/logo', 512),
    render(heroSvg(), 'store/hero', 1600),
  ]);
  await prisma.store.create({
    data: {
      name: 'Khilona',
      tagline: 'Toys, games & joyful gifts',
      description:
        'Khilona is a neighbourhood toy store bringing together safe, thoughtfully chosen toys, games and learning kits for children of every age. Visit us in store or order online for doorstep delivery.',
      logoUrl,
      coverImageUrl,
      phone: '+91 98765 43210',
      whatsapp: '919876543210',
      email: 'hello@khilona.in',
      address: 'Shop 12, Sunrise Arcade, CG Road, Navrangpura',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380009',
      googleMapLink: 'https://www.google.com/maps/search/?api=1&query=CG+Road+Navrangpura+Ahmedabad',
      instagram: 'https://www.instagram.com/',
      facebook: 'https://www.facebook.com/',
      openingTime: '10:00',
      closingTime: '21:00',
      workingDays: 'Monday – Sunday',
      isOpen: true,
      closedMessage: 'We are not accepting online orders right now. Please call us or visit the store.',
      heroTitle: 'Discover Something Fun',
      heroSubtitle: 'Find toys, games and products your kids will love — hand-picked, safe and delivered to your door.',
      heroCtaLabel: 'Shop now',
      announcement: 'Free delivery across Ahmedabad · Pay on delivery · Easy returns within 7 days',
      shippingPolicy:
        'We deliver across Ahmedabad and Gandhinagar, usually within 1–3 working days. After you place an order, our team will call or WhatsApp you to confirm the order and a delivery slot.\n\nDelivery is free within city limits. For orders outside our delivery area, we will contact you with options before confirming.',
      returnPolicy:
        'If a product arrives damaged or is not what you ordered, let us know within 7 days of delivery and we will replace it or refund you.\n\nItems must be unused and in their original packaging. Soft toys and craft consumables cannot be returned once opened for hygiene reasons.',
      privacyPolicy:
        'We only collect the details needed to deliver your order: your name, phone number, address and optional email or location link. We never sell your data.\n\nYour information is used to confirm and deliver orders and to contact you about them.',
      termsAndConditions:
        'Prices and availability are confirmed when our team contacts you after you place an order. Payment is collected on delivery (cash or UPI). Orders may be cancelled by the store if an item becomes unavailable; you will be informed promptly.',
      seoTitle: 'Khilona — Toys, Games & Gifts in Ahmedabad',
      seoDescription:
        'Shop toys, board games, puzzles, learning kits and gifts for kids at Khilona. Order online with pay-on-delivery and quick local delivery.',
    },
  });
  console.log('  ✓ store');
}

async function seedCategories() {
  const ids = new Map<string, string>();
  let sort = 0;
  for (const cat of CATEGORIES) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (existing) {
      ids.set(cat.slug, existing.id);
      continue;
    }
    const imageUrl = await render(productSvg(cat.kind, cat.color, BACKGROUNDS[sort % BACKGROUNDS.length], 0), `categories/${cat.slug}`, 640);
    const created = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl,
        sortOrder: sort++,
        parentId: cat.parent ? ids.get(cat.parent) : null,
      },
    });
    ids.set(cat.slug, created.id);
    console.log(`  ✓ category ${cat.name}`);
  }
  return ids;
}

async function seedProducts(categoryIds: Map<string, string>) {
  for (const [index, p] of PRODUCTS.entries()) {
    if (await prisma.product.findUnique({ where: { slug: p.slug } })) continue;

    const bg = BACKGROUNDS[index % BACKGROUNDS.length];
    const altBg = BACKGROUNDS[(index + 3) % BACKGROUNDS.length];
    const images = [
      await render(productSvg(p.kind, p.color, bg, 0), `products/${p.slug}-1`),
      await render(productSvg(p.kind, p.color, altBg, 1), `products/${p.slug}-2`),
      await render(productSvg(p.kind, p.color, bg, 2), `products/${p.slug}-3`),
    ];
    const variantImages = new Map<string, string>();
    for (const v of p.variants ?? []) {
      if (!v.color) continue;
      const url = await render(productSvg(p.kind, v.color, bg, 0), `products/${p.slug}-${v.sku.toLowerCase()}`);
      variantImages.set(v.sku, url);
    }
    const gallery = [...images.slice(0, 1), ...[...variantImages.values()].filter((u) => u !== images[0]), ...images.slice(1)];

    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          categoryId: categoryIds.get(p.category)!,
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          shortDescription: p.short,
          description: p.description,
          price: p.price,
          salePrice: p.salePrice ?? null,
          stock: p.variants ? 0 : p.stock,
          isFeatured: p.featured ?? false,
          isActive: p.active ?? true,
          sortOrder: index,
          hasVariants: !!p.variants,
          thumbnailUrl: gallery[0],
          specifications: p.specs.map(([label, value]) => ({ label, value })),
          seoDescription: p.short,
          images: { create: gallery.map((url, position) => ({ url, alt: `${p.name} — image ${position + 1}`, position })) },
        },
      });

      if (p.options && p.variants) {
        const valueIds = new Map<string, string>();
        for (const [position, opt] of p.options.entries()) {
          const option = await tx.productOption.create({
            data: {
              productId: product.id,
              name: opt.name,
              position,
              values: { create: opt.values.map((value, i) => ({ value, position: i })) },
            },
            include: { values: true },
          });
          for (const v of option.values) valueIds.set(`${opt.name}=${v.value}`, v.id);
        }
        for (const [position, v] of p.variants.entries()) {
          await tx.productVariant.create({
            data: {
              productId: product.id,
              title: Object.values(v.options).join(' / '),
              sku: v.sku,
              price: v.price ?? null,
              salePrice: v.salePrice ?? null,
              stock: v.stock,
              imageUrl: variantImages.get(v.sku) ?? null,
              position,
              optionValues: { create: Object.entries(v.options).map(([k, val]) => ({ optionValueId: valueIds.get(`${k}=${val}`)! })) },
            },
          });
        }
      }
      await recomputeProductAggregates(tx, product.id);
    });
    console.log(`  ✓ product ${p.name}`);
  }
}

/** A handful of realistic orders so the admin panel has something to manage on first run. */
async function seedDemoOrders() {
  if (process.env.SEED_DEMO_ORDERS === 'false' || config.isProduction) return;
  if ((await prisma.order.count()) > 0) {
    console.log('  • orders exist, demo orders skipped');
    return;
  }

  const demo: {
    customer: { name: string; phone: string; email?: string; address: string; landmark?: string; pincode: string };
    items: { slug: string; variantSku?: string; qty: number }[];
    statuses: OrderStatus[];
    hoursAgo: number;
    note?: string;
  }[] = [
    {
      customer: { name: 'Ananya Mehta', phone: '9824012345', email: 'ananya.mehta@example.com', address: 'B-402, Shaligram Heights, Satellite Road', landmark: 'Near Jodhpur Cross Roads', pincode: '380015' },
      items: [{ slug: 'turbo-racer-remote-control-car', variantSku: 'KH-RC-TURBO-RED', qty: 1 }, { slug: 'speed-cube-3x3', qty: 2 }],
      statuses: [],
      hoursAgo: 2,
      note: 'Birthday gift — please gift wrap if possible.',
    },
    {
      customer: { name: 'Rohan Patel', phone: '9898123456', address: '17, Sahjanand Society, Vastrapur', pincode: '380054' },
      items: [{ slug: 'creative-building-blocks-250-pcs', qty: 1 }],
      statuses: ['CONFIRMED'],
      hoursAgo: 20,
    },
    {
      customer: { name: 'Fatima Shaikh', phone: '9727098765', email: 'fatima.s@example.com', address: '5th Floor, Orchid Towers, Prahladnagar', pincode: '380015' },
      items: [{ slug: 'cuddly-teddy-bear', variantSku: 'KH-TED-CUD-M', qty: 1 }, { slug: 'jumbo-crayons-24-colours', qty: 3 }],
      statuses: ['CONFIRMED', 'PROCESSING', 'OUT_FOR_DELIVERY'],
      hoursAgo: 30,
    },
    {
      customer: { name: 'Vikram Iyer', phone: '9099887766', address: '22, Riverside Bungalows, Paldi', landmark: 'Behind Kocharab Ashram', pincode: '380007' },
      items: [{ slug: 'business-trading-board-game', qty: 1 }, { slug: 'snakes-and-ladders-ludo-2-in-1', qty: 1 }],
      statuses: ['CONFIRMED', 'PROCESSING', 'READY', 'DELIVERED'],
      hoursAgo: 76,
    },
    {
      customer: { name: 'Neha Desai', phone: '9601234567', address: 'A-12, Shivalik Residency, Bopal', pincode: '380058' },
      items: [{ slug: 'magnetic-folding-chess-set', qty: 1 }],
      statuses: ['CANCELLED'],
      hoursAgo: 120,
      note: 'Customer changed their mind.',
    },
  ];

  const admin = await prisma.admin.findFirst({ where: { role: AdminRole.SUPER_ADMIN } });

  for (const d of demo) {
    const createdAt = new Date(Date.now() - d.hoursAgo * 3600_000);
    await prisma.$transaction(async (tx) => {
      const lines = [];
      for (const item of d.items) {
        const product = await tx.product.findUniqueOrThrow({
          where: { slug: item.slug },
          include: { category: true, variants: { include: { optionValues: { include: { optionValue: { include: { option: true } } } } } } },
        });
        const variant = item.variantSku ? product.variants.find((v) => v.sku === item.variantSku)! : undefined;
        const pricing = variant ? resolveVariantPrice(product, variant) : resolvePrice(product.price, product.salePrice);
        lines.push({ product, variant, qty: item.qty, pricing });
        if (variant) await tx.productVariant.update({ where: { id: variant.id }, data: { stock: { decrement: item.qty } } });
        else await tx.product.update({ where: { id: product.id }, data: { stock: { decrement: item.qty } } });
      }

      const day = compactDateInZone(createdAt, config.timezone);
      const [{ value }] = await tx.$queryRaw<{ value: number }[]>`
        INSERT INTO "OrderCounter" ("day", "value") VALUES (${day}, 1)
        ON CONFLICT ("day") DO UPDATE SET "value" = "OrderCounter"."value" + 1 RETURNING "value"`;
      const orderNumber = `${config.orderNumberPrefix}-${day}-${String(value).padStart(4, '0')}`;

      const subtotal = lines.reduce((s, l) => s + l.pricing.price * l.qty, 0);
      const discount = lines.reduce((s, l) => s + (l.pricing.price - l.pricing.effectivePrice) * l.qty, 0);
      const customer = await tx.customer.upsert({
        where: { phone: d.customer.phone },
        create: { name: d.customer.name, phone: d.customer.phone, email: d.customer.email },
        update: {},
      });

      const history: Prisma.OrderStatusHistoryCreateWithoutOrderInput[] = [
        { toStatus: 'PENDING', note: 'Order placed by customer', createdAt },
      ];
      let prev: OrderStatus = 'PENDING';
      d.statuses.forEach((s, i) => {
        history.push({
          fromStatus: prev,
          toStatus: s,
          changedBy: admin ? { connect: { id: admin.id } } : undefined,
          changedByName: admin?.name,
          note: s === 'CANCELLED' ? d.note : null,
          createdAt: new Date(createdAt.getTime() + (i + 1) * 3 * 3600_000),
        });
        prev = s;
      });
      const status = prev as OrderStatus;

      await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          status,
          customerName: d.customer.name,
          customerPhone: d.customer.phone,
          customerEmail: d.customer.email ?? null,
          address: d.customer.address,
          city: 'Ahmedabad',
          state: 'Gujarat',
          pincode: d.customer.pincode,
          landmark: d.customer.landmark ?? null,
          customerNote: status === 'CANCELLED' ? null : (d.note ?? null),
          itemsCount: lines.reduce((s, l) => s + l.qty, 0),
          subtotal,
          discount,
          total: subtotal - discount,
          paymentStatus: status === 'DELIVERED' ? 'PAID' : 'UNPAID',
          confirmedAt: d.statuses.includes('CONFIRMED') ? history[1].createdAt : null,
          deliveredAt: status === 'DELIVERED' ? history[history.length - 1].createdAt : null,
          cancelledAt: status === 'CANCELLED' ? history[history.length - 1].createdAt : null,
          stockRestored: status === 'CANCELLED',
          createdAt,
          items: {
            create: lines.map((l) => ({
              productId: l.product.id,
              variantId: l.variant?.id ?? null,
              productName: l.product.name,
              productSlug: l.product.slug,
              sku: l.variant?.sku ?? l.product.sku,
              variantTitle: l.variant?.title ?? null,
              options: l.variant
                ? l.variant.optionValues.map((ov) => ({ name: ov.optionValue.option.name, value: ov.optionValue.value }))
                : Prisma.JsonNull,
              imageUrl: l.variant?.imageUrl ?? l.product.thumbnailUrl,
              categoryName: l.product.category.name,
              unitMrp: l.pricing.price,
              unitPrice: l.pricing.effectivePrice,
              quantity: l.qty,
              lineTotal: l.pricing.effectivePrice * l.qty,
              createdAt,
            })),
          },
          history: { create: history },
        },
      });

      // Cancelled orders give their stock back (same policy as the API).
      if (status === 'CANCELLED') {
        for (const l of lines) {
          if (l.variant) await tx.productVariant.update({ where: { id: l.variant.id }, data: { stock: { increment: l.qty } } });
          else await tx.product.update({ where: { id: l.product.id }, data: { stock: { increment: l.qty } } });
        }
      }
      for (const productId of new Set(lines.map((l) => l.product.id))) await recomputeProductAggregates(tx, productId);
      console.log(`  ✓ demo order ${orderNumber} (${status})`);
    });
  }
}

async function main() {
  console.log('Seeding Khilona…');
  await seedAdmins();
  await seedStore();
  const categoryIds = await seedCategories();
  await seedProducts(categoryIds);
  await seedDemoOrders();
  console.log('\nDone. Development admin logins (change before production!):');
  for (const a of DEV_ADMINS) console.log(`  ${a.role.padEnd(11)} ${a.email} / ${a.password}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
