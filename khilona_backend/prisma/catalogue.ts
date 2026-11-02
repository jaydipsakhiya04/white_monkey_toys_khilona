/**
 * Real WHITE MONKEY TOYS catalogue, built from the product photographs in `data/WHITE MONKEY/`.
 *
 *   npm run catalogue:import
 *
 * - Creates the categories and products below (matched by slug, so it is safe to re-run;
 *   existing products are left untouched so admin edits are never overwritten).
 * - Photos are resized and converted to WebP through the configured storage provider.
 * - The illustrated demo catalogue from `seed.ts` is deactivated (not deleted), so past orders
 *   keep working and it can be re-enabled from the admin panel.
 * - Store details still holding the seed's placeholder values are replaced with the real
 *   address, phone and logo. Anything already edited in the admin panel is kept.
 *
 * Names, descriptions and specifications only use what is printed on the packaging or visible in
 * the photos. Prices are suggested starting points and stock is a placeholder (10 per item):
 * review both in Admin → Products before going live.
 *
 * Source folders (override with CATALOGUE_DIR / CATALOGUE_LOGO):
 *   ../data/WHITE MONKEY/<folder>/*.jpeg   — photos are referenced by their position when the
 *                                            folder is sorted by file name (natural order)
 *   ../data/logo/white_moneky_logo.png
 */
import { config as loadEnv } from 'dotenv';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import { loadConfig } from '../src/config/configuration';
import { recomputeProductAggregates } from '../src/products/pricing';
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

const PHOTO_DIR = resolve(process.env.CATALOGUE_DIR ?? '../data/WHITE MONKEY');
const LOGO_FILE = resolve(process.env.CATALOGUE_LOGO ?? '../data/logo/white_moneky_logo.png');
const PLACEHOLDER_STOCK = 10;

// ─── Categories ──────────────────────────────────────────────

interface CatalogueCategory {
  slug: string;
  name: string;
  folder: string;
  description: string;
  /** photo used for the category card: [folder index] */
  cover: number;
  intro: string;
}

const CATEGORIES: CatalogueCategory[] = [
  {
    slug: 'hobby-grade-rc-cars',
    name: 'Hobby-Grade RC Cars',
    folder: 'HOBBY GRADE RC CARS',
    cover: 0,
    description: 'Brushless monster trucks, rally cars, buggies and scale crawlers built for real off-road driving.',
    intro: 'A hobby-grade RC built for proper off-road driving — dirt, gravel, grass and driveway jumps.',
  },
  {
    slug: 'premium-rc-cars',
    name: 'Premium RC Cars',
    folder: 'PREMUIM RC CARS',
    cover: 12,
    description: 'Licensed supercars, rally replicas and drift cars with full-function remote control.',
    intro: 'A detailed remote-control car that looks as good on the shelf as it does on the move.',
  },
  {
    slug: 'construction-rc',
    name: 'Construction RC',
    folder: 'CONSTRUCION RC ITEMS',
    cover: 8,
    description: 'Excavators, dump trucks, mixers, cranes and bulldozers that dig, tip and lift by remote.',
    intro: 'A working remote-control construction vehicle for big site-building adventures.',
  },
  {
    slug: 'drones-and-rc-aircraft',
    name: 'Drones & RC Aircraft',
    folder: 'DRONES',
    cover: 12,
    description: 'Camera drones, LED flyers, RC helicopters and warbird planes for beginners and pilots.',
    intro: 'Take play to the sky with this remote-control flyer.',
  },
  {
    slug: 'action-figures',
    name: 'Action Figures',
    folder: 'ACTION FIGURES',
    cover: 19,
    description: 'Marvel and Star Wars heroes — collectible figures with display stands and boxed hero figures.',
    intro: 'A detailed, poseable figure for fans and collectors — ready for the display shelf or the next big battle.',
  },
  {
    slug: 'licensed-die-cast-cars',
    name: 'Licensed Die-cast Cars',
    folder: 'LICENSE METALS CARS',
    cover: 1,
    description: 'Officially licensed metal replicas — Fast & Furious, Porsche, Aston Martin and more.',
    intro: 'An officially licensed metal replica for collectors and car enthusiasts.',
  },
  {
    slug: 'scale-models-and-dioramas',
    name: 'Scale Models & Dioramas',
    folder: 'GADGETS',
    cover: 10,
    description: '1:64 scene models, garages and display dioramas to showcase your die-cast collection.',
    intro: 'A display scene to bring your 1:64 die-cast collection to life.',
  },
];

// ─── Products ────────────────────────────────────────────────

interface CatalogueVariant {
  /** option value, e.g. "Yellow" */
  value: string;
  photo: number;
}

interface CatalogueProduct {
  category: string;
  slug: string;
  name: string;
  /** photo positions in the category folder; the first one is the main image */
  photos: number[];
  price: number;
  short: string;
  specs?: [string, string][];
  featured?: number;
  option?: { name: string; variants: CatalogueVariant[] };
}

const CLOSING =
  'Details and specifications are taken from the manufacturer’s packaging shown in the photos. Want to check what’s in the box, the battery or the colour before ordering? Message us on WhatsApp — we’re happy to help.';

const P = (
  category: string,
  slug: string,
  name: string,
  photos: number[],
  price: number,
  short: string,
  extra: Partial<CatalogueProduct> = {},
): CatalogueProduct => ({ category, slug, name, photos, price, short, ...extra });

const HB = 'hobby-grade-rc-cars';
const PR = 'premium-rc-cars';
const CR = 'construction-rc';
const DR = 'drones-and-rc-aircraft';
const AF = 'action-figures';
const LM = 'licensed-die-cast-cars';
const GD = 'scale-models-and-dioramas';

const PRODUCTS: CatalogueProduct[] = [
  // Hobby-grade RC cars
  P(HB, 'bronco-style-rc-scale-crawler', 'Bronco-Style RC Scale Crawler', [18, 19], 5999, 'A detailed scale crawler with roof rack and light bar, ready for rocks, trails and garden obstacles.', {
    featured: 4,
    option: { name: 'Color', variants: [{ value: 'Yellow', photo: 18 }, { value: 'Teal', photo: 19 }] },
  }),
  P(HB, 'suzuki-jimny-rc-crawler', 'Suzuki Jimny RC Crawler', [14], 6999, 'The iconic Jimny in bright green, scaled down into a capable remote-control crawler.', { featured: 3 }),
  P(HB, 'classic-pickup-rc-crawler', 'Classic Pickup RC Crawler', [17, 20], 4999, 'A retro full-size pickup reimagined as an RC crawler, with light bar and chunky off-road tyres.', {
    featured: 8,
    option: { name: 'Color', variants: [{ value: 'Blue', photo: 17 }, { value: 'Brown', photo: 20 }] },
  }),
  P(HB, '4wd-high-speed-off-road-rc-truck', '4WD High-Speed Off-Road RC Truck', [0], 3499, 'A bold blue-and-yellow off-road truck with big shock-absorbing tyres for bumpy ground.'),
  P(HB, 'short-course-rc-truck-orange', 'Short-Course RC Truck — Orange', [1], 2999, 'A low, wide short-course truck in racing livery, made for fast laps and sliding turns.'),
  P(HB, 'wltoys-xk-1-12-4wd-rc-rock-buggy', 'WLtoys XK 1:12 4WD RC Rock Buggy', [2], 4499, 'An open-frame 4WD buggy with roof lights and grippy red-rim tyres.', {
    specs: [['Brand', 'WLtoys XK'], ['Scale', '1:12'], ['Drive', '4WD'], ['Radio', '2.4 GHz'], ['Top speed (box)', '40+ km/h']],
  }),
  P(HB, 'ford-bronco-r-h8p-1-8-brushless-rc', 'Ford Bronco R H8P 1:8 Brushless RC', [3], 24999, 'An officially licensed Ford Bronco R with a 3S FOC brushless system and a big 1:8 body.', {
    specs: [['Model', 'H8P (DC)'], ['Scale', '1:8'], ['Motor', 'FOC brushless, 3S'], ['Licence', 'Ford official licensed'], ['Body', 'PC']],
  }),
  P(HB, '14208-brushless-1-14-monster-truck', '14208 Brushless 1:14 Monster Truck', [4], 7999, 'A brushless monster truck with LED light bar, built to launch off ramps and power through dirt.', {
    specs: [['Model', '14208'], ['Scale', '1:14'], ['Motor', 'Brushless'], ['Body', 'PC']],
  }),
  P(HB, 'h12y-1-12-brushless-crawler', 'H12Y 1:12 Brushless Crawler', [5], 9999, 'A rugged brushless crawler with an aluminium alloy body and front LED lights.', {
    specs: [['Model', 'H12Y'], ['Scale', '1:12'], ['Motor', 'Brushless, 2S'], ['Body', 'Aluminium alloy']],
  }),
  P(HB, '14211-brushless-1-14-short-course-truck', '14211 Brushless 1:14 Short-Course Truck', [6], 7999, 'A brushless short-course truck in white racing livery with bright LED headlights.', {
    specs: [['Model', '14211'], ['Scale', '1:14'], ['Motor', 'Brushless'], ['Body', 'PC']],
  }),
  P(HB, 'citroen-c3-wrc-1-10-brushless-rally-car', 'Citroën C3 WRC 1:10 Brushless Rally Car', [7], 12999, 'The Abu Dhabi Citroën C3 WRC rally car recreated as a 1:10 brushless RC.', {
    specs: [['Scale', '1:10'], ['Motor', 'Brushless'], ['Licence', 'Citroën C3 WRC'], ['Body', 'PC']],
  }),
  P(HB, 'citroen-c3-wrc-7303dc-1-7-brushless-rally-car', 'Citroën C3 WRC 7303DC 1:7 Brushless Rally Car', [8], 29999, 'A big 1:7 Citroën C3 WRC in Total livery with a brushless power system.', {
    specs: [['Model', '7303DC'], ['Scale', '1:7'], ['Motor', 'Brushless'], ['Licence', 'Citroën C3 WRC'], ['Body', 'PC']],
  }),
  P(HB, 'volkswagen-polo-r-wrc-7304-1-7-brushless-rally-car', 'Volkswagen Polo R WRC 7304 1:7 Brushless Rally Car', [9], 29999, 'An officially licensed Volkswagen Polo R WRC rally car at a large 1:7 scale.', {
    specs: [['Model', '7304'], ['Scale', '1:7'], ['Motor', 'Brushless'], ['Licence', 'Volkswagen official licensed'], ['Body', 'PC']],
  }),
  P(HB, 'power-drift-4wd-rc-car-with-led', 'Power Drift 4WD RC Car with LED', [10], 3999, 'A graffiti-style 4WD drift car with LED lights, ready to run straight out of the box.', {
    specs: [['Drive', '4WD'], ['Radio', '2.4 GHz'], ['Ready to run', 'Yes (RTR)']],
  }),
  P(HB, 'off-road-rc-rock-crawler-black-red', 'Off-Road RC Rock Crawler — Black & Red', [11], 4499, 'A high-clearance crawler with a cage roof and aggressive tread for climbing.'),
  P(HB, 'sweep-4wd-rc-monster-truck', 'Sweep 4WD RC Monster Truck', [12], 3999, 'A pink-and-black 4WD monster truck with oversized tyres and long-travel suspension.', { specs: [['Drive', '4WD']] }),
  P(HB, 'high-speed-rc-truggy', 'High-Speed RC Truggy', [13], 4999, 'A sleek truggy with a rear wing and big tyres for speed runs on any surface.'),
  P(HB, 'c8815-4wd-off-road-rc-jeep', 'C8815 4WD Off-Road RC Jeep', [15], 5999, 'A classic military-style off-road jeep with canvas cover and working winch.', {
    specs: [['Model', 'C8815'], ['Drive', '4WD'], ['In the box (as pictured)', 'Remote, rechargeable battery, USB charging cable, winch, canvas cover, manual']],
  }),
  P(HB, 'scale-rc-crawler-truck-grey', 'Scale RC Crawler Truck — Grey', [16], 6999, 'A tough, boxy scale crawler with roof light bar and heavy-duty bumpers.'),
  P(HB, 'scale-rc-utility-truck-silver', 'Scale RC Utility Truck — Silver', [21], 6999, 'A detailed utility truck with flatbed and roof lights, built for slow, technical crawling.'),
  P(HB, '18208-1-18-rc-monster-truck', '18208 1:18 RC Monster Truck', [22], 3499, 'A compact monster truck that comes with a spare body and two batteries for longer play.', {
    specs: [['Model', '18208'], ['Scale', '1:18'], ['Motor', 'Brushed, 2S'], ['In the box (as pictured)', '2 batteries, 2 bodies']],
  }),
  P(HB, '1-12-rtr-short-course-truck-with-esp', '1:12 RTR Short-Course Truck with ESP', [23], 4999, 'A ready-to-run short-course truck with ESP stability control to help correct slides.', {
    specs: [['Scale', '1:12'], ['Ready to run', 'Yes (RTR)'], ['Stability', 'ESP yaw correction']],
  }),
  P(HB, 'racing-rally-rtr-short-course-truck', 'Racing Rally RTR Short-Course Truck', [24, 25, 26], 5999, 'A ready-to-run short-course truck with full LED light kit and oil-filled shocks.', {
    specs: [['Brand', 'HB Toys — Racing Rally'], ['Ready to run', 'Yes (RTR)'], ['Recommended age (box)', '14+']],
    option: { name: 'Color', variants: [{ value: 'Blue', photo: 24 }, { value: 'Orange', photo: 25 }, { value: 'Red', photo: 26 }] },
  }),
  P(HB, 'climbing-beast-4x4-rc-crawler', 'Climbing Beast 4x4 RC Crawler', [27, 28, 29, 30], 5499, 'A big 4x4 crawler with working lights, a 7.4 V Li-ion battery and USB charging.', {
    specs: [['Brand', 'HB Toys — Climbing Beast'], ['Drive', '4x4'], ['Battery (box)', '7.4 V Li-ion, USB charging'], ['Recommended age (box)', '15+']],
    option: {
      name: 'Style',
      variants: [
        { value: 'Blue Pickup', photo: 27 },
        { value: 'White & Red', photo: 28 },
        { value: 'Dark Green', photo: 29 },
        { value: 'Desert Tan', photo: 30 },
      ],
    },
  }),
  P(HB, 'wilderness-rtr-rc-crawler', 'Wilderness RTR RC Crawler', [31, 32, 33], 5999, 'A ready-to-run SUV crawler with roof rack and spare wheel, at home on rough trails.', {
    specs: [['Brand', 'HB Toys — Wilderness'], ['Ready to run', 'Yes (RTR)']],
    option: { name: 'Color', variants: [{ value: 'Blue', photo: 31 }, { value: 'White', photo: 32 }, { value: 'Grey', photo: 33 }] },
  }),
  P(HB, 'defender-style-1-16-rtr-rc-crawler', 'Defender-Style 1:16 RTR RC Crawler', [34], 4999, 'A black expedition crawler with roof rack and light bar, splash-resistant to IPX4.', {
    specs: [['Scale', '1:16'], ['Drive', '4WD'], ['Radio', '2.4 GHz'], ['Water resistance', 'IPX4'], ['Ready to run', 'Yes (RTR)']],
  }),
  P(HB, 'scy-16106-pro-brushless-buggy', 'SCY-16106 PRO Brushless Buggy', [35], 8999, 'A brushless desert buggy rated by the maker at 70+ km/h, with a lit roll cage.', {
    specs: [['Model', 'SCY-16106 PRO'], ['Motor', 'Brushless'], ['Top speed (box)', '70+ km/h']],
  }),
  P(HB, 'steyr-1500a-wwii-rc-staff-car', 'Steyr 1500A WWII RC Staff Car', [36], 7999, 'A historic German WWII staff car replica with smoke and sound effects, in two body styles.', {
    specs: [['Model', 'HG4-51'], ['Radio', '2.4 GHz']],
  }),
  P(HB, 'suv-rc-crawler-white', 'SUV RC Crawler — White', [37], 4499, 'A clean, realistic white SUV crawler with roof rack and off-road tyres.'),
  P(HB, '16218-brushless-1-16-monster-truck', '16218 Brushless 1:16 Monster Truck', [38], 6499, 'A brushless 1:16 monster truck with LED bar, built to tear through dirt.', {
    specs: [['Model', '16218'], ['Scale', '1:16'], ['Motor', 'Brushless']],
  }),
  P(HB, 'ford-mustang-shelby-gt500-10306-1-10-brushless', 'Ford Mustang Shelby GT500 10306 1:10 Brushless', [39], 11999, 'An officially licensed Shelby GT500 on-road car with a brushless system.', {
    specs: [['Model', '10306 (DC)'], ['Scale', '1:10'], ['Motor', 'Brushless'], ['Licence', 'Ford official licensed'], ['Body', 'PC']],
  }),
  P(HB, '16212-brushless-1-16-truggy', '16212 Brushless 1:16 Truggy', [40], 6499, 'A brushless 1:16 truggy in red, white and blue, with LED lights.', {
    specs: [['Model', '16212'], ['Scale', '1:16'], ['Motor', 'Brushless']],
  }),
  P(HB, 'h8e-1-8-brushless-pickup-crawler', 'H8E 1:8 Brushless Pickup Crawler', [41], 22999, 'A big 1:8 pickup crawler with a 3S FOC brushless system and full roof light bar.', {
    specs: [['Model', 'H8E (DC)'], ['Scale', '1:8'], ['Motor', 'FOC brushless, 3S'], ['Body', 'PC']],
  }),
  P(HB, 'h8h-1-8-brushless-expedition-crawler', 'H8H 1:8 Brushless Expedition Crawler', [42], 22999, 'A 1:8 expedition crawler with roof basket, ladder and a 3S FOC brushless system.', {
    specs: [['Model', 'H8H (DC)'], ['Scale', '1:8'], ['Motor', 'FOC brushless, 3S']],
  }),
  P(HB, '4wd-rc-monster-truck-red-black', '4WD RC Monster Truck — Red & Black', [43], 3999, 'A big-wheeled monster truck with a sharp red-and-black body.'),
  P(HB, 'hoshi-4wd-rc-monster-truck-orange', 'Hoshi 4WD RC Monster Truck — Orange', [44], 4499, 'A Hoshi monster truck with a bold orange body and deep-tread tyres.', { specs: [['Brand', 'Hoshi']] }),
  P(HB, 'rc-truggy-grey-camo', 'RC Truggy — Grey Camo', [45], 5999, 'A truggy in grey camo, shown with its battery, charger, tools and accessories.'),
  P(HB, 'hoshi-frenzy-1-12-brushless-monster-truck', 'Hoshi Frenzy 1:12 Brushless Monster Truck', [46], 9999, 'A full-scale 4x4 brushless off-road truck rated by the maker at 70+ km/h.', {
    specs: [['Brand', 'Hoshi — Frenzy'], ['Scale', '1:12'], ['Motor', 'Brushless'], ['Drive', '4x4'], ['Top speed (box)', '70+ km/h']],
  }),
  P(HB, '16213-brushless-1-16-buggy', '16213 Brushless 1:16 Buggy', [47], 6499, 'A low-slung brushless buggy with a big rear wing, made for speed on dirt.', {
    specs: [['Model', '16213'], ['Scale', '1:16'], ['Motor', 'Brushless']],
  }),

  // Premium RC cars
  P(PR, 'mercedes-amg-gt2-rc-car', 'Mercedes-AMG GT2 RC Car', [3], 3499, 'A licensed Mercedes-AMG GT2 with a steering-wheel style remote and opening gull-wing doors.', {
    featured: 7,
    specs: [['Licence', 'Mercedes-AMG']],
  }),
  P(PR, 'porsche-911-dakar-rc-car', 'Porsche 911 Dakar RC Car', [4], 3499, 'The rally-inspired Porsche 911 Dakar with roof rack, steered by a wheel-style remote.', { featured: 12, specs: [['Licence', 'Porsche']] }),
  P(PR, '4wd-rc-pickup-crawler', '4WD RC Pickup Crawler', [0], 3499, 'A classic-style 4WD pickup crawler with chunky tyres, shown in three colours.'),
  P(PR, 'hyper-go-43308-rc-rally-car', 'Hyper Go 43308 RC Rally Car', [1], 3999, 'A Hyper Go rally car in white-and-red livery with a sporty rear wing.', { specs: [['Brand', 'Hyper Go'], ['Model', '43308']] }),
  P(PR, '911-1-43-4wd-drift-alloy-rc-car', '911 1:43 4WD Drift Alloy RC Car', [2], 2499, 'A palm-sized 4WD drift car with an alloy body, drift tyres and cones.', {
    specs: [['Scale', '1:43'], ['Drive', '4WD'], ['Body', 'Alloy'], ['Car size (box)', '11.7 × 5 × 3.5 cm']],
  }),
  P(PR, '6x6-rc-army-truck', '6x6 RC Army Truck', [5], 2999, 'A six-wheel army truck with a covered cargo bed and pistol-grip remote.'),
  P(PR, 'mini-off-road-rc-jeeps-with-lights', 'Mini Off-Road RC Jeeps with Lights', [6], 1499, 'Compact off-road jeeps with working lights, available in several colours.', { specs: [['Radio', '2.4 GHz'], ['Lights', 'Yes']] }),
  P(PR, 'maisto-tech-bluetooth-rc-volkswagen-touareg-1-64', 'Maisto Tech Bluetooth RC Volkswagen Touareg 1:64', [7], 1999, 'A tiny Touareg you drive from your phone over Bluetooth with the Maisto app.', {
    specs: [['Brand', 'Maisto Tech R/C'], ['Scale', '1:64'], ['Control', 'Bluetooth app'], ['Recommended age (box)', '6+']],
  }),
  P(PR, 'maisto-tech-bluetooth-rc-hummer-h3-1-64', 'Maisto Tech Bluetooth RC Hummer H3 1:64', [8], 1999, 'A pocket-sized Hummer H3 controlled from your phone over Bluetooth.', {
    specs: [['Brand', 'Maisto Tech R/C'], ['Scale', '1:64'], ['Control', 'Bluetooth app'], ['Recommended age (box)', '6+']],
  }),
  P(PR, 'maisto-tech-ferrari-laferrari-rc-car', 'Maisto Tech Ferrari LaFerrari RC Car', [9], 2999, 'An officially licensed Ferrari LaFerrari in classic red.', { specs: [['Brand', 'Maisto Tech'], ['Licence', 'Ferrari']] }),
  P(PR, 'maisto-mercedes-amg-petronas-f1-rc-car', 'Maisto Mercedes-AMG Petronas F1 RC Car', [10], 3499, 'The Mercedes-AMG Petronas Formula One car as a licensed remote-control model.', {
    specs: [['Brand', 'Maisto Tech'], ['Licence', 'Mercedes-AMG Petronas F1']],
  }),
  P(PR, '1-64-alloy-rc-tractor-with-tanker', '1:64 Alloy RC Tractor with Tanker', [11], 1999, 'A mini alloy tractor towing a water tanker, with a small remote and USB charging.', { specs: [['Scale', '1:64'], ['Body', 'Alloy']] }),
  P(PR, 'rc-hypercar-red', 'RC Hypercar — Red', [12], 2999, 'A sleek red hypercar with racing number 10 and a full-function remote.'),
  P(PR, 'd43-01q-1-43-rc-drift-car', 'D43-01Q 1:43 RC Drift Car', [13], 2499, 'A tabletop drift car with spare drift tyres and cones for setting up a course.', { specs: [['Model', 'D43-01Q'], ['Scale', '1:43']] }),
  P(PR, 'rtr-1-43-app-control-drift-car', 'RTR 1:43 App-Control Drift Car', [14, 15], 2999, 'A 4WD drift car with ESP and app control, plus spare tyres, cones and a spare shell.', {
    specs: [['Scale', '1:43'], ['Drive', '4WD'], ['Stability', 'ESP'], ['Control', 'Remote + app'], ['Ready to run', 'Yes (RTR)']],
    option: { name: 'Style', variants: [{ value: 'RP4304 Blue & Silver', photo: 14 }, { value: 'RP4301 White & Red', photo: 15 }] },
  }),
  P(PR, 'fpv-camera-rc-car-with-screen-remote', 'FPV Camera RC Car with Screen Remote', [16], 4499, 'A camera car that streams a driver’s-eye view to the built-in screen on its remote.'),

  // Construction RC
  P(CR, 'rc-excavator-yellow', 'RC Excavator — Yellow', [1], 6999, 'A Huina tracked excavator with a full-function remote — dig, swing and drive.', { featured: 1, specs: [['Brand', 'Huina']] }),
  P(CR, 'rc-dump-truck-with-carry-case', 'RC Dump Truck with Carry Case', [0], 8999, 'A 45 cm tipper truck that comes with its remote, battery, charger and a hard carry case.', {
    specs: [['Size (as pictured)', '45 × 15 × 20 cm'], ['In the box (as pictured)', 'Carry case, remote, battery, USB charger']],
  }),
  P(CR, 'rc-excavator-white-with-carry-case', 'RC Excavator — White, with Carry Case', [2], 7999, 'A white Huina excavator with a heavy bucket, supplied with a protective carry case.', { specs: [['Brand', 'Huina']] }),
  P(CR, 'heavy-duty-rc-excavator-grey-green', 'Heavy-Duty RC Excavator — Grey & Green', [3], 6499, 'A large grey-and-green Huina excavator with a wide toothed bucket.', { specs: [['Brand', 'Huina']] }),
  P(CR, 'rc-excavator-grey-yellow', 'RC Excavator — Grey & Yellow', [4], 4999, 'A grey-and-yellow tracked excavator with a gamepad-style remote.'),
  P(CR, 'rc-semi-trailer-tipper', 'RC Semi-Trailer Tipper', [5], 5999, 'A detailed semi-trailer tipper body in black and red.'),
  P(CR, 'rc-scania-770-tractor-head', 'RC Scania 770 Tractor Head', [6], 9999, 'A big red Scania 770 truck cab for hauling trailers.', { specs: [['Licence', 'Scania']] }),
  P(CR, '12-channel-rc-concrete-mixer-truck-1-14', '12-Channel RC Concrete Mixer Truck 1:14', [7], 5499, 'A Huina 12-channel mixer truck with a spinning drum, from the alloy engineering series.', {
    specs: [['Brand', 'Huina'], ['Model', 'No. 1537'], ['Scale', '1:14'], ['Channels', '12']],
  }),
  P(CR, 'rc-mining-dump-truck', 'RC Mining Dump Truck', [8], 2999, 'A big-wheeled mining dump truck with a tipping bed and lights.'),
  P(CR, 'rc-tower-crane', 'RC Tower Crane', [9], 3999, 'A tall Huina tower crane that rotates, trolleys and lifts its hook by remote.', { specs: [['Brand', 'Huina']] }),
  P(CR, 'rc-backhoe-loader-tractor', 'RC Backhoe Loader Tractor', [10], 4499, 'A green backhoe loader with a front bucket and rear digger, shown with battery and charger.', {
    specs: [['Size (as pictured)', '77 × 18 × 20.5 cm']],
  }),
  P(CR, 'rc-concrete-pump-truck', 'RC Concrete Pump Truck', [11], 7999, 'A Huina concrete pump truck with a long folding boom.', { specs: [['Brand', 'Huina']] }),
  P(CR, 'rc-bulldozer', 'RC Bulldozer', [12], 5999, 'A heavy Huina bulldozer with a wide blade and rear ripper.', { specs: [['Brand', 'Huina']] }),
  P(CR, 'rc-6x6-military-truck', 'RC 6x6 Military Truck', [13], 3499, 'A six-wheel military cargo truck with a remote, battery, charger and screwdriver.', {
    specs: [['In the box (as pictured)', 'Remote, battery, USB charger, screwdriver']],
  }),
  P(CR, 'rc-articulated-dump-truck', 'RC Articulated Dump Truck', [14], 3999, 'A yellow Huina articulated dump truck with a tipping bed.', { specs: [['Brand', 'Huina']] }),
  P(CR, 'rc-flatbed-low-loader-truck', 'RC Flatbed Low-Loader Truck', [15], 7499, 'A Huina truck with a long flatbed low-loader trailer and fold-down ramps.', { specs: [['Brand', 'Huina']] }),
  P(CR, 'rc-excavator-gift-box-edition', 'RC Excavator — Gift Box Edition', [16], 8999, 'A Huina excavator presented in a premium gift box.', { specs: [['Brand', 'Huina']] }),
  P(CR, 'rc-concrete-mixer-truck-white-green', 'RC Concrete Mixer Truck — White & Green', [17], 4999, 'A Huina mixer truck with a rotating drum and a full-function remote.', { featured: 11, specs: [['Brand', 'Huina']] }),
  P(CR, '26-channel-rc-timber-grapple-dump-truck-1-14', '26-Channel RC Timber Grapple Dump Truck 1:14', [18], 9499, 'A Huina dump truck with a working grapple arm for picking up logs.', {
    specs: [['Brand', 'Huina'], ['Scale', '1:14'], ['Channels', '26'], ['Size (as pictured)', '50.9 × 16.7 × 37.1 cm']],
  }),

  // Drones & RC aircraft
  P(DR, 'rc-helicopter-with-camera', 'RC Helicopter with Camera', [13], 3499, 'A 4DRC helicopter with LED lights and a camera that streams to your phone.', { featured: 6, specs: [['Brand', '4DRC']] }),
  P(DR, '3-in-1-hovercraft-drone', '3-in-1 Hovercraft Drone', [0], 2999, 'A 4DRC drone that drives on land, skims over water and flies.', { specs: [['Brand', '4DRC']] }),
  P(DR, 'rc-corsair-fighter-plane', 'RC Corsair Fighter Plane', [1], 3999, 'A blue Corsair-style warbird RC plane with a pistol-grip transmitter.'),
  P(DR, 'sky-king-f959s-3-channel-rc-airplane', 'Sky King F959S 3-Channel RC Airplane', [2], 4999, 'A beginner-friendly 3-channel glider with 6-axis gyro stabilisation.', {
    specs: [['Model', 'F959S'], ['Channels', '3'], ['Stabilisation', '6-axis gyro'], ['Radio', '2.4 GHz']],
  }),
  P(DR, 'wltoys-xk-a310-rc-biplane', 'WLtoys XK A310 RC Biplane', [3], 6999, 'A lime-green aerobatic biplane with a brushless motor and 3D/6-axis gyro modes.', {
    specs: [['Brand', 'WLtoys XK'], ['Model', 'A310'], ['Motor', '1504 brushless'], ['Stabilisation', '3D / 6-axis gyro']],
  }),
  P(DR, 'a220-p-40-fighter-rc-plane', 'A220 P-40 Fighter RC Plane', [4], 5999, 'The classic P-40 shark-mouth fighter as a ready-to-fly RC warbird.', { specs: [['Model', 'A220']] }),
  P(DR, 'voice-controlled-flying-sword-drone', 'Voice-Controlled Flying Sword Drone', [5], 2499, 'A sword-shaped flyer that responds to voice commands and rolls 360°.'),
  P(DR, 'k11-camera-drone-with-water-bomb-attachment', 'K11 Camera Drone with Water-Bomb Attachment', [6], 3499, 'A foldable camera drone with a gel water-bomb launcher attachment.', { specs: [['Model', 'K11']] }),
  P(DR, 'voice-control-land-air-drifting-car', 'Voice-Control Land & Air Drifting Car', [7], 2999, 'A car-drone hybrid that drifts on the ground and lifts off, with voice control.'),
  P(DR, 'ufo-led-drone-with-camera', 'UFO LED Drone with Camera', [8], 2999, 'A 4DRC saucer drone ringed with LEDs, with a phone-holder controller.', { specs: [['Brand', '4DRC']] }),
  P(DR, 'spherical-cage-drone', 'Spherical Cage Drone', [9], 1999, 'A drone inside a protective spherical cage — bounce off walls and keep flying.'),
  P(DR, 'foldable-mini-camera-drone-white', 'Foldable Mini Camera Drone — White', [10], 2499, 'A compact foldable drone with camera, phone-holder controller and carry box.'),
  P(DR, '4k-aerial-space-shuttle-drone', '4K Aerial Space Shuttle Drone', [11], 3499, 'A space-shuttle-styled drone with a 4K aerial camera.', { specs: [['Camera', '4K (as stated on box)']] }),
  P(DR, 'led-glow-drone', 'LED Glow Drone', [12], 1999, 'A drone with glowing LED propeller guards, shown with spare props and charging cable.'),
  P(DR, 'led-airliner-rc-plane', 'LED Airliner RC Plane', [14], 2499, 'A white passenger-jet RC plane lined with colourful LEDs.'),
  P(DR, 'led-jet-fighter-rc-plane', 'LED Jet Fighter RC Plane', [15], 2499, 'A blue-and-white jet fighter RC plane with LED lights and spare propellers.'),
  P(DR, 'combination-land-and-air-drone-set', 'Combination Land & Air Drone Set', [16], 1999, 'A 24-piece land-and-air drone combination set.', { specs: [['Model', 'YF07']] }),
  P(DR, 'dinosaur-flying-drone', 'Dinosaur Flying Drone', [17], 1999, 'A blue dinosaur-styled flying drone with a handheld controller.', { specs: [['Brand', '4DRC']] }),
  P(DR, 'hand-fly-orb-drone', 'Hand-Fly Orb Drone', [18], 1999, 'A light-up orb drone you can fly by hand — the white complete set.', { specs: [['Brand', '4DRC'], ['Version', 'White complete set, hand-fly']] }),
  P(DR, 'a280-p-51-mustang-rc-warbird', 'A280 P-51 Mustang RC Warbird', [19], 7999, 'A detailed P-51 Mustang RC plane kit with transmitter and spare parts.', { specs: [['Model', 'A280']] }),

  // Action figures
  P(AF, 'marvel-spider-man-action-figure', 'Marvel Spider-Man Action Figure', [13, 8], 1299, 'A large, poseable Spider-Man figure in a window box.', { featured: 5, specs: [['Licence', 'Marvel']] }),
  P(AF, 'star-wars-mandalorian-din-djarin-figure', 'Star Wars The Mandalorian — Din Djarin Figure', [0], 3499, 'A detailed Din Djarin collectible in beskar armour, with his collector box.', { featured: 10, specs: [['Licence', 'Star Wars']] }),
  P(AF, 'spider-man-collectible-figure-with-stand', 'Spider-Man Collectible Figure with Stand', [1], 2999, 'A highly articulated Spider-Man with swappable hands, web effects and a display stand.', { specs: [['Licence', 'Marvel']] }),
  P(AF, 'scarlet-spider-collectible-figure', 'Scarlet Spider Collectible Figure', [2], 2999, 'Scarlet Spider with extra hands, web effects and a display stand.', { specs: [['Licence', 'Marvel']] }),
  P(AF, 'spider-man-advanced-suit-collectible-figure', 'Spider-Man Advanced Suit Collectible Figure', [3], 2999, 'Spider-Man in his Advanced Suit with accessories and a display stand.', { specs: [['Licence', 'Marvel']] }),
  P(AF, 'iron-man-collectible-figure-with-stand', 'Iron Man Collectible Figure with Stand', [4], 3299, 'Iron Man with repulsor blast effects, swappable hands and a display stand.', { specs: [['Licence', 'Marvel']] }),
  P(AF, 'iron-spider-collectible-figure-with-stand', 'Iron Spider Collectible Figure with Stand', [5], 3299, 'Iron Spider with golden spider legs, web effects and a display stand.', { specs: [['Licence', 'Marvel']] }),
  P(AF, 'deadpool-collectible-figure-with-stand', 'Deadpool Collectible Figure with Stand', [6], 2999, 'Deadpool with twin katanas, swappable hands and a display stand.', { specs: [['Licence', 'Marvel']] }),
  P(AF, 'spider-man-black-gold-suit-mask', 'Spider-Man Black & Gold Suit Mask', [7], 1499, 'A collectible mask display in Spider-Man’s black-and-gold suit design.', { specs: [['Licence', 'Marvel']] }),
  P(AF, 'miles-morales-collectible-figure-with-stand', 'Miles Morales Collectible Figure with Stand', [17], 2999, 'Spider-Man Miles Morales with web effects, accessories and a display stand.', { specs: [['Licence', 'Marvel']] }),
  P(AF, 'marvel-miles-morales-action-figure', 'Marvel Miles Morales Action Figure', [12, 9], 1299, 'A large, poseable Miles Morales figure in a window box.', { specs: [['Licence', 'Marvel']] }),
  P(AF, 'marvel-iron-spider-action-figure', 'Marvel Iron Spider Action Figure', [15, 10], 1299, 'A large Iron Spider figure with golden spider legs, in a window box.', { specs: [['Licence', 'Marvel']] }),
  P(AF, 'marvel-iron-man-action-figure', 'Marvel Iron Man Action Figure', [18, 11], 1299, 'A large, poseable Iron Man figure in a window box.', { specs: [['Licence', 'Marvel']] }),
  P(AF, 'marvel-ghost-spider-action-figure', 'Marvel Ghost-Spider Action Figure', [14], 1299, 'A large Ghost-Spider figure in a window box.', { specs: [['Licence', 'Marvel']] }),
  P(AF, 'marvel-hulk-action-figure', 'Marvel Hulk Action Figure', [16], 1499, 'A big, poseable Hulk figure in a window box.', { specs: [['Licence', 'Marvel']] }),
  P(AF, 'marvel-captain-america-action-figure', 'Marvel Captain America Action Figure', [19], 1299, 'A large Captain America figure with his shield, in a window box.', { specs: [['Licence', 'Marvel']] }),
  P(AF, 'marvel-black-panther-action-figure', 'Marvel Black Panther Action Figure', [20], 1299, 'A large, poseable Black Panther figure in a window box.', { specs: [['Licence', 'Marvel']] }),

  // Licensed die-cast cars
  P(LM, 'fast-furious-brians-toyota-supra-with-figure', 'Fast & Furious Brian’s Toyota Supra with Figure', [2], 2499, 'Brian’s iconic orange Toyota Supra with a Brian O’Conner figure.', { featured: 2, specs: [['Licence', 'Fast & Furious'], ['Material', 'Die-cast metal']] }),
  P(LM, 'fast-furious-doms-mazda-rx-7', 'Fast & Furious Dom’s Mazda RX-7', [1], 1999, 'Dom’s red Mazda RX-7 from Fast & Furious, in its collector window box.', { specs: [['Licence', 'Fast & Furious'], ['Material', 'Die-cast metal']] }),
  P(LM, 'fast-furious-seans-ford-mustang', 'Fast & Furious Sean’s Ford Mustang', [0], 1999, 'Sean’s dark green Ford Mustang with white racing stripes.', { specs: [['Licence', 'Fast & Furious'], ['Material', 'Die-cast metal']] }),
  P(LM, 'fast-furious-2006-dodge-charger', 'Fast & Furious 2006 Dodge Charger', [5], 1999, 'The matte-black 2006 Dodge Charger from Fast X.', { specs: [['Licence', 'Fast & Furious'], ['Material', 'Die-cast metal']] }),
  P(LM, 'porsche-911-gt1-lm-1998-1-64', 'Porsche 911 GT1 LM 1998 1:64', [3], 1499, 'The 1998 Le Mans Porsche 911 GT1 in its famous #26 livery, by Trends Hobby.', {
    specs: [['Brand', 'Trends Hobby'], ['Scale', '1:64'], ['Licence', 'Porsche official licensed']],
  }),
  P(LM, 'porsche-911-gt3-r-le-mans-2025-1-64', 'Porsche 911 GT3 R 24H Le Mans 2025 #92 1:64', [4], 1499, 'The 2025 Le Mans Porsche 911 GT3 R #92 in light-blue livery, by Trends Hobby.', {
    specs: [['Brand', 'Trends Hobby'], ['Scale', '1:64'], ['Licence', 'Porsche official licensed']],
  }),
  P(LM, 'pop-race-singer-targa-dark-chrome-1-64', 'Pop Race Singer Targa Dark Chrome 1:64', [6], 1299, 'A Singer Targa in dark chrome from Pop Race’s Dark Chrome Series.', { specs: [['Brand', 'Pop Race'], ['Scale', '1:64'], ['Model', 'PRDC-001']] }),
  P(LM, 'pop-race-skyline-gt-r-r32-dark-chrome-1-64', 'Pop Race Skyline GT-R R32 Dark Chrome 1:64', [9], 1299, 'A Nissan Skyline GT-R R32 in dark chrome from Pop Race’s Dark Chrome Series.', {
    specs: [['Brand', 'Pop Race'], ['Scale', '1:64'], ['Model', 'PRDC-002']],
  }),
  P(LM, 'aston-martin-db12-1-64', 'Aston Martin DB12 1:64', [7, 8], 2499, 'An officially licensed Aston Martin DB12 with an acrylic display case and gift box, by ATS.', {
    specs: [['Brand', 'ATS'], ['Scale', '1:64'], ['Licence', 'Official licensed product']],
    option: { name: 'Color', variants: [{ value: 'Red', photo: 7 }, { value: 'Green', photo: 8 }] },
  }),

  // Scale models & dioramas
  P(GD, 'starbucks-store-miniature-scene-1-64', 'Starbucks Store Miniature Scene 1:64', [9], 3499, 'A lit Starbucks storefront scene with parking for your 1:64 cars.', { featured: 9, specs: [['Brand', 'MoreArt'], ['Scale', '1:64']] }),
  P(GD, 'rafale-fighter-jet-model-with-stand', 'Rafale Fighter Jet Model with Stand', [17, 0], 2999, 'A detailed Rafale fighter jet model with display stand and missile set.'),
  P(GD, 'garage-display-scene-1-64', 'Garage Display Scene 1:64', [1], 1999, 'A lit Haus-Welt garage display scene for 1:64 cars.', { specs: [['Brand', 'MoreArt'], ['Scale', '1:64'], ['Model', '970109']] }),
  P(GD, 'suzuki-shop-diorama-1-64', 'Suzuki Shop Diorama 1:64', [2, 14], 2499, 'A two-storey Suzuki showroom scene with street-side parking.', { specs: [['Brand', 'MoreArt'], ['Scale', '1:64']] }),
  P(GD, 'glass-display-case-scene-1-64', 'Glass Display Case Scene 1:64', [3], 2499, 'A clear display case with a rooftop-garden scene for 1:64 cars.', { specs: [['Brand', 'MoreArt'], ['Scale', '1:64']] }),
  P(GD, 'led-parking-garage-diorama-1-64', 'LED Parking Garage Diorama 1:64', [4, 5], 1799, 'A light-up parking garage assembly model for 1:64 cars.', { specs: [['Brand', 'MoreArt'], ['Scale', '1:64'], ['Lighting', 'LED (light version)']] }),
  P(GD, 'morimoto-factory-scene-model-1-64', 'Morimoto Factory Scene Model 1:64', [6], 2999, 'A Japanese factory scene with a courtyard car park.', { specs: [['Brand', 'MoreArt'], ['Scale', '1:64']] }),
  P(GD, 'kubota-restaurant-scene-1-64', 'Kubota Restaurant Scene 1:64', [7], 2999, 'A Japanese street-corner restaurant scene with parking bays.', { specs: [['Brand', 'MoreArt'], ['Scale', '1:64']] }),
  P(GD, 'mcdonalds-restaurant-scene-1-64', 'McDonald’s Restaurant Scene 1:64', [8], 3499, 'A lit fast-food restaurant scene with a large car park.', { specs: [['Brand', 'MoreArt'], ['Scale', '1:64'], ['Model', '936213']] }),
  P(GD, 'shell-gas-station-scene-model-1-64', 'Shell Gas Station Scene Model 1:64', [10], 3499, 'A lit Shell fuel station with forecourt and shop.', { specs: [['Brand', 'MoreArt'], ['Scale', '1:64']] }),
  P(GD, 'kfc-restaurant-parking-scene-1-64', 'KFC Restaurant Parking Scene 1:64', [11], 3499, 'A lit KFC restaurant scene with roadside parking.', { specs: [['Brand', 'MoreArt'], ['Scale', '1:64']] }),
  P(GD, 'gulf-led-assembly-garage-1-64', 'Gulf LED Assembly Garage 1:64', [12], 2999, 'A Gulf-liveried modification garage with LED lighting.', { specs: [['Brand', 'MoreArt'], ['Scale', '1:64'], ['Lighting', 'LED']] }),
  P(GD, 'mazda-double-layer-exhibition-hall-1-64', 'Mazda Double-Layer Exhibition Hall 1:64', [13], 3999, 'A modular two-level Mazda showroom for displaying your collection.', { specs: [['Brand', 'MoreArt'], ['Scale', '1:64'], ['Model', '936018']] }),
  P(GD, 'multi-level-parking-tower-1-64', 'Multi-Level Parking Tower 1:64', [15], 3499, 'A four-level parking tower display for 1:64 cars.', { specs: [['Brand', 'MoreArt'], ['Scale', '1:64'], ['Model', '922004']] }),
  P(GD, 'rural-bridge-scene-1-64', 'Rural Bridge Scene 1:64', [16], 2999, 'A countryside bridge scene with greenery and figures.', { specs: [['Brand', 'MoreArt'], ['Scale', '1:64'], ['Model', '901336']] }),
  P(GD, 'lakeside-shore-scene-model-1-64', 'Lakeside Shore Scene Model 1:64', [18], 2999, 'A lakeside jetty scene in a clear display case.', { specs: [['Brand', 'MoreArt'], ['Scale', '1:64']] }),
  P(GD, 'rugged-hill-scene-model-1-64', 'Rugged Hill Scene Model 1:64', [19], 2999, 'A rugged hill terrain scene in a clear display case.', { specs: [['Brand', 'MoreArt'], ['Scale', '1:64']] }),
];

/** Categories created by `seed.ts` with illustrated demo products. */
const LEGACY_CATEGORY_SLUGS = [
  'toys',
  'cars-and-vehicles',
  'dolls-and-soft-toys',
  'building-and-construction',
  'learning-and-educational',
  'games-and-puzzles',
  'board-games',
  'puzzles',
  'outdoor-and-sports',
  'baby-and-toddler',
  'arts-and-crafts',
];

/**
 * Earlier default values (from seed.ts, or from previous versions of this script) that are replaced
 * with the real store details. Anything else was edited in the admin panel and is kept.
 */
const STORE_PLACEHOLDERS = {
  phone: ['+91 98765 43210'],
  address: ['Shop 12, Sunrise Arcade, CG Road, Navrangpura'],
  heroTitle: ['Find Something They’ll Love'],
  announcement: [
    'Free delivery across Ahmedabad · Pay on delivery · Easy returns within 7 days',
    'Free Delivery Across Ahmedabad | Cash on Delivery | Easy Returns Within 7 Days',
  ],
  tagline: ['Toys, games & joyful gifts', 'RC cars, drones, action figures & collectibles'],
  seoTitle: ['White Monkey Toys — Toys, Games & Gifts in Ahmedabad', 'White Monkey Toys — RC Cars, Drones, Action Figures & Collectibles'],
  shippingPolicy: [
    'We deliver across Ahmedabad and Gandhinagar, usually within 1–3 working days. After you place an order, our team will call or WhatsApp you to confirm the order and a delivery slot.\n\nDelivery is free within city limits. For orders outside our delivery area, we will contact you with options before confirming.',
  ],
};

const isPlaceholder = (value: string | null, defaults: string[]) => !value || defaults.includes(value);

/** Store copy for the real business: a retail & wholesale toy shop in Varachha, Surat. */
const STORE_COPY = {
  tagline: 'Toy shop in Varachha, Surat — retail & wholesale',
  description:
    'White Monkey Toys is a toy shop in Varachha, Surat, for hobby-grade RC cars, drones, construction RC, action figures, licensed die-cast cars and display dioramas. Shop retail online with free delivery across Surat and cash on delivery, or contact us for wholesale and retailer pricing.',
  seoTitle: 'White Monkey Toys | Toy Shop in Surat (Varachha) – Retail & Wholesale Toys',
  seoDescription:
    'White Monkey Toys — the toy shop in Varachha, Surat for RC cars, drones, action figures and collectibles. Free delivery across Surat, cash on delivery, and wholesale toy prices for retailers.',
  shippingPolicy:
    'We deliver across Surat, usually within 1–3 working days. After you place an order, our team will call or WhatsApp you to confirm the order and a delivery slot.\n\nDelivery is free everywhere in Surat. For orders outside Surat, we will contact you with delivery options and charges before confirming. Wholesale and bulk orders are delivered as agreed with our team.',
};

const REAL_STORE = {
  phone: '+91 96627 25685',
  whatsapp: '919662725685',
  address: 'Sarti Complex, F-16, Varachha Main Rd, near Hirabaug, Beside Doctor House, Tapsil Society, Hirabaugh',
  city: 'Surat',
  state: 'Gujarat',
  pincode: '395006',
  googleMapLink:
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent('White Monkey Toys, Sarti Complex, Varachha Main Rd, Hirabaug, Surat, Gujarat 395006'),
  heroTitle: 'Little Moments. Big Adventures.',
  heroSubtitle: 'Discover thoughtfully selected toys, creative games, and educational essentials that bring joy to every little adventure.',
  heroCtaLabel: 'Explore Collection',
  announcement: 'Free Delivery Across Surat | Cash on Delivery | Retail & Wholesale | Easy Returns Within 7 Days',
};

// ─── Helpers ─────────────────────────────────────────────────

const folderFiles = new Map<string, string[]>();

function photoPath(folder: string, index: number): string {
  if (!folderFiles.has(folder)) {
    const dir = resolve(PHOTO_DIR, folder);
    const files = readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    folderFiles.set(folder, files);
  }
  const file = folderFiles.get(folder)![index];
  if (!file) throw new Error(`No photo #${index} in "${folder}"`);
  return resolve(PHOTO_DIR, folder, file);
}

const uploaded = new Map<string, string>();

/** Square-ish product photos: max 1200 px, WebP. The same photo is only uploaded once. */
async function uploadPhoto(folder: string, index: number, key: string): Promise<string> {
  const source = photoPath(folder, index);
  const cached = uploaded.get(source);
  if (cached) return cached;
  const buffer = await sharp(source)
    .rotate()
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 84 })
    .toBuffer();
  const url = (await storage.put(`catalogue/${key}.webp`, buffer, 'image/webp')).url;
  uploaded.set(source, url);
  return url;
}

// ─── Steps ───────────────────────────────────────────────────

async function importCategories(): Promise<Map<string, { id: string; folder: string }>> {
  const result = new Map<string, { id: string; folder: string }>();
  for (const [sortOrder, cat] of CATEGORIES.entries()) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (existing) {
      result.set(cat.slug, { id: existing.id, folder: cat.folder });
      continue;
    }
    const imageUrl = await uploadPhoto(cat.folder, cat.cover, `categories/${cat.slug}`);
    const created = await prisma.category.create({
      data: { name: cat.name, slug: cat.slug, description: cat.description, imageUrl, sortOrder, seoDescription: cat.description },
    });
    result.set(cat.slug, { id: created.id, folder: cat.folder });
    console.log(`  ✓ category ${cat.name}`);
  }
  return result;
}

async function importProducts(categories: Map<string, { id: string; folder: string }>) {
  let created = 0;
  for (const [index, p] of PRODUCTS.entries()) {
    if (await prisma.product.findUnique({ where: { slug: p.slug } })) continue;
    const cat = categories.get(p.category)!;
    const meta = CATEGORIES.find((c) => c.slug === p.category)!;
    const images: string[] = [];
    for (const [i, photo] of p.photos.entries()) images.push(await uploadPhoto(cat.folder, photo, `products/${p.slug}-${i + 1}`));
    const variantImages = new Map<number, string>();
    for (const v of p.option?.variants ?? []) {
      variantImages.set(v.photo, await uploadPhoto(cat.folder, v.photo, `products/${p.slug}-${v.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`));
    }
    const description = `${meta.intro}\n\n${p.short}\n\n${CLOSING}`;
    const sku = `WM-${p.category.split('-').map((w) => w[0]).join('').toUpperCase()}-${String(index + 1).padStart(3, '0')}`;

    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          categoryId: cat.id,
          name: p.name,
          slug: p.slug,
          sku,
          shortDescription: p.short,
          description,
          price: p.price,
          stock: p.option ? 0 : PLACEHOLDER_STOCK,
          isFeatured: p.featured !== undefined,
          sortOrder: p.featured ?? 100 + index,
          hasVariants: !!p.option,
          thumbnailUrl: images[0],
          specifications: (p.specs ?? []).map(([label, value]) => ({ label, value })),
          seoDescription: p.short,
          images: { create: images.map((url, position) => ({ url, alt: `${p.name} — image ${position + 1}`, position })) },
        },
      });

      if (p.option) {
        const option = await tx.productOption.create({
          data: {
            productId: product.id,
            name: p.option.name,
            position: 0,
            values: { create: p.option.variants.map((v, i) => ({ value: v.value, position: i })) },
          },
          include: { values: true },
        });
        for (const [position, v] of p.option.variants.entries()) {
          const value = option.values.find((ov) => ov.value === v.value)!;
          await tx.productVariant.create({
            data: {
              productId: product.id,
              title: v.value,
              sku: `${sku}-${String(position + 1).padStart(2, '0')}`,
              stock: PLACEHOLDER_STOCK,
              imageUrl: variantImages.get(v.photo) ?? null,
              position,
              optionValues: { create: [{ optionValueId: value.id }] },
            },
          });
        }
      }
      await recomputeProductAggregates(tx, product.id);
    });
    created++;
    console.log(`  ✓ ${p.name}`);
  }
  console.log(`  • ${created} new products (${PRODUCTS.length - created} already present)`);
}

async function retireDemoCatalogue() {
  const legacy = await prisma.category.findMany({ where: { slug: { in: LEGACY_CATEGORY_SLUGS }, isActive: true }, select: { id: true } });
  if (legacy.length === 0) return;
  const ids = legacy.map((c) => c.id);
  const products = await prisma.product.updateMany({ where: { categoryId: { in: ids }, isActive: true }, data: { isActive: false, isFeatured: false } });
  await prisma.category.updateMany({ where: { id: { in: ids } }, data: { isActive: false } });
  console.log(`  ✓ deactivated the illustrated demo catalogue (${legacy.length} categories, ${products.count} products)`);
}

async function updateStore() {
  const store = await prisma.store.findFirst();
  if (!store) {
    console.log('  • no store record yet — run the seed first');
    return;
  }
  const data: Record<string, string | null> = {};
  if (isPlaceholder(store.phone, STORE_PLACEHOLDERS.phone)) {
    data.phone = REAL_STORE.phone;
    data.whatsapp = REAL_STORE.whatsapp;
  }
  if (isPlaceholder(store.address, STORE_PLACEHOLDERS.address)) {
    Object.assign(data, {
      address: REAL_STORE.address,
      city: REAL_STORE.city,
      state: REAL_STORE.state,
      pincode: REAL_STORE.pincode,
      googleMapLink: REAL_STORE.googleMapLink,
    });
  }
  if (isPlaceholder(store.heroTitle, STORE_PLACEHOLDERS.heroTitle)) {
    Object.assign(data, { heroTitle: REAL_STORE.heroTitle, heroSubtitle: REAL_STORE.heroSubtitle, heroCtaLabel: REAL_STORE.heroCtaLabel });
  }
  if (isPlaceholder(store.announcement, STORE_PLACEHOLDERS.announcement)) data.announcement = REAL_STORE.announcement;
  if (isPlaceholder(store.tagline, STORE_PLACEHOLDERS.tagline)) {
    data.tagline = STORE_COPY.tagline;
    // the default descriptions were written together with their taglines
    data.description = STORE_COPY.description;
  }
  if (isPlaceholder(store.seoTitle, STORE_PLACEHOLDERS.seoTitle)) {
    data.seoTitle = STORE_COPY.seoTitle;
    data.seoDescription = STORE_COPY.seoDescription;
  }
  if (isPlaceholder(store.shippingPolicy, STORE_PLACEHOLDERS.shippingPolicy)) data.shippingPolicy = STORE_COPY.shippingPolicy;
  // the seed's cover is a cartoon illustration; drop it so only a real store photo is ever shown
  if (store.coverImageUrl?.includes('/seed/store/hero')) data.coverImageUrl = null;
  if (!store.logoUrl && existsSync(LOGO_FILE)) {
    // official logo, trimmed to its artwork (transparent background kept)
    const buffer = await sharp(LOGO_FILE).trim().png().toBuffer();
    data.logoUrl = (await storage.put('store/white-monkey-logo.png', buffer, 'image/png')).url;
  }
  if (Object.keys(data).length === 0) {
    console.log('  • store details already customised, kept');
    return;
  }
  await prisma.store.update({ where: { id: store.id }, data });
  console.log(`  ✓ store details updated (${Object.keys(data).join(', ')})`);
}

async function main() {
  if (!existsSync(PHOTO_DIR)) throw new Error(`Photo folder not found: ${PHOTO_DIR} (set CATALOGUE_DIR)`);
  console.log('Importing the WHITE MONKEY TOYS catalogue…');
  const categories = await importCategories();
  await importProducts(categories);
  await retireDemoCatalogue();
  await updateStore();
  console.log('\nDone. Review suggested prices and placeholder stock (10 per item) in Admin → Products.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
