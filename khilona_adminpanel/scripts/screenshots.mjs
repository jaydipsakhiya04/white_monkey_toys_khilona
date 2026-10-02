// Responsive review helper: captures full-page screenshots of the key screens at several widths
// and reports horizontal overflow. Requires the app (port 3001) and the API to be running.
//
//   node scripts/screenshots.mjs [outDir]
//
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3001';
const API = (process.env.E2E_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');
const EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@khilona.in';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'Admin@12345';
const OUT = process.argv[2] || path.join(os.tmpdir(), 'khilona_shots', 'admin');
const WIDTHS = (process.env.WIDTHS || '320,360,390,768,1024,1440,1920').split(',').map(Number);
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;

fs.mkdirSync(OUT, { recursive: true });

async function apiLogin() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const json = await res.json();
  return json.data.accessToken;
}

async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(400);
}

const token = await apiLogin();
const h = { Authorization: `Bearer ${token}` };
const orders = await (await fetch(`${API}/admin/orders?limit=20`, { headers: h })).json();
const order = orders.data.items.find((o) => o.status === 'PENDING') ?? orders.data.items[0];
const products = await (await fetch(`${API}/admin/products?limit=50`, { headers: h })).json();
const product = products.data.items.find((p) => p.hasVariants) ?? products.data.items[0];

const pages = [
  ['dashboard', '/'],
  ['orders', '/orders'],
  ['order-detail', `/orders/${order.id}`],
  ['products', '/products'],
  ['product-form', `/products/${product.id}`],
  ['product-new', '/products/new'],
  ['categories', '/categories'],
  ['store', '/store'],
  ['settings', '/settings'],
  ['profile', '/profile'],
].filter(([name]) => !ONLY || ONLY.includes(name) || ONLY.includes('all'));

const browser = await chromium.launch();
const report = [];
for (const width of WIDTHS) {
  const height = width < 768 ? 800 : 900;
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
  const page = await context.newPage();
  await page.goto(`${BASE}/login`);
  await settle(page);
  if (!ONLY || ONLY.includes('login')) await page.screenshot({ path: path.join(OUT, `login-${width}.png`), fullPage: true });
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  for (const [name, url] of pages) {
    await page.goto(`${BASE}${url}`);
    await settle(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    report.push({ width, name, overflow });
    await page.screenshot({ path: path.join(OUT, `${name}-${width}.png`), fullPage: true });
  }
  await context.close();
}
await browser.close();

const bad = report.filter((r) => r.overflow > 0);
console.log(`Screenshots saved to ${OUT}`);
console.log(bad.length ? `Horizontal overflow:\n${bad.map((b) => `  ${b.name}@${b.width}: +${b.overflow}px`).join('\n')}` : 'No horizontal overflow detected.');
