import { test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Responsive screenshot sweep. Run with `npm run screenshots`.
 * Output: SHOTS_DIR (default: %TEMP%/khilona_shots/user). Not part of CI.
 */
const API = process.env.E2E_API_URL ?? "http://localhost:4000/api";
const OUT = process.env.SHOTS_DIR ?? path.join(process.env.TEMP ?? "/tmp", "khilona_shots", "user");
const WIDTHS = (process.env.SHOT_WIDTHS ?? "320,360,390,768,1024,1440,1920").split(",").map(Number);
const ONLY = process.env.SHOT_PAGES?.split(",");

type Card = { id: string; slug: string; name: string; thumbnailUrl: string | null; effectivePrice: number; price: number; stock: number; hasVariants: boolean; inStock: boolean };

async function api<T>(p: string): Promise<T> {
  const res = await fetch(`${API}${p}`);
  const json = (await res.json()) as { data: T };
  return json.data;
}

async function checkOverflow(page: Page, label: string) {
  const over = await page.evaluate(() => {
    const doc = document.documentElement;
    const offenders: string[] = [];
    if (doc.scrollWidth > doc.clientWidth + 1) {
      document.querySelectorAll<HTMLElement>("body *").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > doc.clientWidth + 1 && r.width > 0 && getComputedStyle(el).position !== "fixed") {
          offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} right=${Math.round(r.right)}`);
        }
      });
    }
    return { scroll: doc.scrollWidth, client: doc.clientWidth, offenders: offenders.slice(0, 5) };
  });
  if (over.scroll > over.client + 1) console.log(`OVERFLOW ${label}: ${over.scroll} > ${over.client}`, over.offenders);
}

test("responsive screenshots", async ({ browser }) => {
  fs.mkdirSync(OUT, { recursive: true });
  const list = await api<{ items: Card[] }>("/products?limit=30");
  const simple = list.items.filter((p) => !p.hasVariants && p.inStock).slice(0, 2);
  const variantProduct = list.items.find((p) => p.hasVariants) ?? list.items[0];
  const cats = await api<{ slug: string; children: unknown[] }[]>("/categories");
  const category = cats.find((c) => c.children.length > 0) ?? cats[0];

  const cart = {
    state: {
      items: simple.map((p, i) => ({
        key: `${p.id}:`,
        productId: p.id,
        variantId: null,
        quantity: i + 1,
        snapshot: {
          name: p.name,
          slug: p.slug,
          imageUrl: p.thumbnailUrl,
          unitPrice: p.effectivePrice,
          unitMrp: p.price,
          variantTitle: null,
          options: null,
          maxQuantity: Math.min(99, p.stock),
        },
        addedAt: Date.now(),
      })),
    },
    version: 1,
  };

  const order = {
    orderNumber: "KH-20261002-0042",
    status: "PENDING",
    createdAt: new Date().toISOString(),
    customerName: "Priya Sharma",
    customerPhone: "9876543210",
    alternatePhone: null,
    customerEmail: "priya@example.com",
    address: "Flat 4B, Shanti Residency, Near City Mall, Satellite Road",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380015",
    landmark: "Opp. Petrol Pump",
    googleMapsLink: "https://www.google.com/maps?q=23.03,72.51",
    locationLink: null,
    customerNote: null,
    items: simple.map((p, i) => ({
      productName: p.name,
      productSlug: p.slug,
      variantTitle: null,
      options: [],
      imageUrl: p.thumbnailUrl,
      sku: null,
      quantity: i + 1,
      unitMrp: p.price,
      unitPrice: p.effectivePrice,
      lineTotal: p.effectivePrice * (i + 1),
    })),
    itemsCount: 3,
    subtotal: 1000,
    discount: 100,
    shippingFee: 0,
    total: 900,
    paymentMethod: "CASH_ON_DELIVERY",
    paymentStatus: "UNPAID",
    history: [{ status: "PENDING", createdAt: new Date().toISOString() }],
  };

  const pages: { name: string; url: string; seed?: boolean }[] = [
    { name: "home", url: "/" },
    { name: "category", url: `/category/${category.slug}` },
    { name: "products-search", url: "/products?search=car" },
    { name: "product", url: `/product/${variantProduct.slug}` },
    { name: "cart", url: "/cart", seed: true },
    { name: "checkout", url: "/checkout", seed: true },
    { name: "success", url: `/order/success/${order.orderNumber}` },
    { name: "track", url: "/track-order" },
    { name: "contact", url: "/contact" },
    { name: "categories", url: "/categories" },
    { name: "notfound", url: "/this-page-does-not-exist" },
  ].filter((p) => !ONLY || ONLY.includes(p.name));

  for (const width of WIDTHS) {
    const ctx = await browser.newContext({
      viewport: { width, height: width < 768 ? 800 : width < 1280 ? 1000 : 1000 },
      deviceScaleFactor: 1,
      isMobile: width < 768,
      hasTouch: width < 768,
    });
    await ctx.addInitScript(
      ({ cartJson, orderJson, orderNumber }) => {
        try {
          localStorage.setItem("khilona-cart", cartJson);
          sessionStorage.setItem(`khilona-order-${orderNumber}`, orderJson);
        } catch {
          /* ignore */
        }
      },
      { cartJson: JSON.stringify(cart), orderJson: JSON.stringify(order), orderNumber: order.orderNumber },
    );
    const page = await ctx.newPage();
    for (const p of pages) {
      await page.goto(p.url, { waitUntil: "networkidle" });
      await page.waitForTimeout(600);
      await checkOverflow(page, `${p.name}@${width}`);
      await page.screenshot({ path: path.join(OUT, `${p.name}-${width}.png`), fullPage: true });
      if (process.env.SHOT_CHUNKS) {
        // viewport-height slices that are easier to review than one tall image
        const total = await page.evaluate(() => document.documentElement.scrollHeight);
        const h = width < 768 ? 1100 : 1400;
        for (let y = 0, i = 0; y < total && i < 8; y += h, i++) {
          await page.screenshot({
            path: path.join(OUT, `${p.name}-${width}-part${i + 1}.png`),
            fullPage: true,
            clip: { x: 0, y, width, height: Math.min(h, total - y) },
          });
        }
      }
    }
    await ctx.close();
  }
  console.log(`Screenshots written to ${OUT}`);
});
