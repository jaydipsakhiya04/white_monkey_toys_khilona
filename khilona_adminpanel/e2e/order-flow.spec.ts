import path from 'node:path';
import { expect, test } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD, API_URL, login } from './helpers';

const FIXTURE = path.join(__dirname, 'fixtures', 'toy.png');

test('category → product (with image) → public order → confirm order', async ({ page, request }) => {
  const stamp = Date.now();
  const categoryName = `E2E Category ${stamp}`;
  const productName = `E2E Wooden Train ${stamp}`;

  await login(page);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // ---- create category ----
  await page.goto('/categories');
  await page.getByRole('button', { name: 'New category' }).first().click();
  const sheet = page.getByRole('dialog', { name: 'New category' });
  await expect(sheet).toBeVisible();
  await sheet.getByLabel(/^Name/).fill(categoryName);
  await expect(sheet.getByLabel('URL slug')).toHaveValue(`e2e-category-${stamp}`);
  await sheet.getByRole('button', { name: 'Create category' }).click();
  await expect(page.getByText(`“${categoryName}” created`)).toBeVisible();
  await expect(sheet).toBeHidden();
  await expect(page.getByRole('button', { name: categoryName, exact: true })).toBeVisible();

  // ---- create product with an image ----
  await page.goto('/products/new');
  await page.getByLabel(/^Name/).fill(productName);
  await page.getByLabel(/^Category/).selectOption({ label: categoryName });
  await page.getByLabel(/^Short description/).fill('A sturdy wooden train set for toddlers.');
  await page.getByTestId('product-image-input').setInputFiles(FIXTURE);
  const images = page.getByRole('list', { name: 'Product images (drag to reorder)' });
  await expect(images.getByText('Cover')).toBeVisible({ timeout: 30_000 });
  await expect(images.locator('img').first()).toHaveAttribute('src', /^https?:\/\/.+\/uploads\//);
  await page.getByLabel(/^Price \(MRP\)/).fill('499');
  await page.getByLabel(/^Sale price/).fill('449');
  await expect(page.getByText('10% off')).toBeVisible();
  await page.getByLabel(/^Stock/).fill('25');
  await page.getByRole('button', { name: 'Create product' }).click();
  await expect(page.getByText(`“${productName}” created`)).toBeVisible();
  await expect(page).toHaveURL(/\/products$/);

  // ---- place an order through the public API ----
  const list = await request.get(`${API_URL}/products`, { params: { search: productName, limit: 5 } });
  expect(list.ok()).toBeTruthy();
  const product = (await list.json()).data.items.find((p: { name: string }) => p.name === productName);
  expect(product, 'new product is visible in the public catalogue').toBeTruthy();

  const orderRes = await request.post(`${API_URL}/orders`, {
    data: {
      customerName: 'E2E Customer',
      phone: '9812345678',
      email: 'e2e@example.com',
      address: '12, Test Street, Navrangpura',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380009',
      landmark: 'Opposite test park',
      note: 'Automated e2e order',
      items: [{ productId: product.id, quantity: 2 }],
    },
  });
  expect(orderRes.status(), await orderRes.text()).toBe(201);
  const order = (await orderRes.json()).data as { orderNumber: string; total: number };
  expect(order.total).toBe(898);

  // ---- find it in the orders list ----
  await page.goto('/orders');
  await page.getByRole('searchbox', { name: 'Search orders' }).fill(order.orderNumber);
  await expect(page).toHaveURL(new RegExp(`search=${order.orderNumber}`));
  const link = page.getByRole('link', { name: order.orderNumber }).first();
  await expect(link).toBeVisible();
  await link.click();

  // ---- order detail: PENDING → CONFIRMED ----
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(order.orderNumber);
  await expect(page.getByText(productName).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Call/ }).first()).toHaveAttribute('href', 'tel:+919812345678');
  const confirmed = page.getByRole('radio', { name: 'Confirmed' });
  await confirmed.click();
  await expect(confirmed).toHaveAttribute('aria-checked', 'true');
  const note = `Confirmed on call ${stamp}`;
  await page.getByLabel('Note (optional)').fill(note);
  await page.getByRole('button', { name: 'Mark as confirmed' }).click();
  await expect(page.getByText(`Order ${order.orderNumber} marked as confirmed`)).toBeVisible();

  const timeline = page.getByRole('list', { name: 'Order status history' });
  await expect(timeline.getByText('from pending')).toBeVisible();
  await expect(timeline.getByText(note)).toBeVisible();
  // only transitions allowed after CONFIRMED are offered now
  await expect(page.getByRole('radio', { name: 'Processing' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Confirmed' })).toHaveCount(0);

  // ---- clean up: keep test data out of the storefront ----
  // Cancelling restores stock; deactivating hides the product/category (orders keep their history).
  const auth = await request.post(`${API_URL}/auth/login`, { data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  const headers = { Authorization: `Bearer ${(await auth.json()).data.accessToken}` };
  const cancel = await request.patch(`${API_URL}/admin/orders/${order.orderNumber}/status`, {
    headers,
    data: { status: 'CANCELLED', note: 'Automated e2e cleanup' },
  });
  expect(cancel.ok(), await cancel.text()).toBeTruthy();
  const hideProduct = await request.patch(`${API_URL}/admin/products/${product.id}/status`, { headers, data: { isActive: false } });
  expect(hideProduct.ok()).toBeTruthy();
  const hideCategory = await request.put(`${API_URL}/admin/categories/${product.category.id}`, { headers, data: { isActive: false } });
  expect(hideCategory.ok()).toBeTruthy();
});
