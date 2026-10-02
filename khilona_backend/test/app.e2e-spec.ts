import { INestApplication } from '@nestjs/common';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import request from 'supertest';
import { PrismaService } from '../src/database/prisma.service';
import { createApp, login, resetDatabase, samplePng, seedBasics, STAFF } from './helpers';

describe('Khilona API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  const http = () => request(app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    ({ app, prisma } = await createApp());
    await resetDatabase(prisma);
    await seedBasics(prisma);
    token = (await login(app)).token;
  });

  afterAll(async () => {
    await app.close();
    await rm(resolve(process.cwd(), 'uploads-test'), { recursive: true, force: true });
  });

  // ─── Infrastructure ────────────────────────────────────────

  describe('health & envelope', () => {
    it('reports healthy with the success envelope', async () => {
      const res = await http().get('/api/health').expect(200);
      expect(res.body).toMatchObject({ success: true, data: { status: 'ok', database: 'up' } });
    });

    it('returns the error envelope for unknown routes', async () => {
      const res = await http().get('/api/does-not-exist').expect(404);
      expect(res.body).toMatchObject({ success: false, statusCode: 404, errors: [] });
    });
  });

  // ─── Auth ──────────────────────────────────────────────────

  describe('authentication', () => {
    it('rejects wrong credentials with 401', async () => {
      const res = await http().post('/api/auth/login').send({ email: 'owner@test.khilona', password: 'nope' }).expect(401);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('validates the login payload with 422', async () => {
      const res = await http().post('/api/auth/login').send({ email: 'not-an-email' }).expect(422);
      expect(res.body.errors.map((e: { field: string }) => e.field)).toEqual(expect.arrayContaining(['email', 'password']));
    });

    it('never exposes the password hash', async () => {
      const res = await http().get('/api/auth/me').set(auth()).expect(200);
      expect(res.body.data.email).toBe('owner@test.khilona');
      expect(res.body.data).not.toHaveProperty('passwordHash');
    });

    it('protects admin routes', async () => {
      await http().get('/api/admin/dashboard').expect(401);
      await http().get('/api/admin/dashboard').set({ Authorization: 'Bearer garbage' }).expect(401);
    });

    it('rotates refresh tokens and detects reuse', async () => {
      const { cookie } = await login(app);
      const first = await http().post('/api/auth/refresh').set('Cookie', cookie).expect(200);
      expect(first.body.data.accessToken).toBeTruthy();
      const rotated = ([] as string[]).concat(first.headers['set-cookie']).find((c) => c.startsWith('khilona_rt='))!.split(';')[0];
      expect(rotated).not.toBe(cookie);

      // Re-using the old token is treated as theft: everything is revoked.
      await http().post('/api/auth/refresh').set('Cookie', cookie).expect(401);
      await http().post('/api/auth/refresh').set('Cookie', rotated).expect(401);
    });

    it('logout revokes the refresh token', async () => {
      const { cookie } = await login(app);
      await http().post('/api/auth/logout').set('Cookie', cookie).expect(200);
      await http().post('/api/auth/refresh').set('Cookie', cookie).expect(401);
    });

    it('enforces roles (ADMIN cannot manage admin users)', async () => {
      const staff = await login(app, STAFF);
      await http().get('/api/admin/admins').set({ Authorization: `Bearer ${staff.token}` }).expect(403);
      await http().get('/api/admin/admins').set(auth()).expect(200);
    });
  });

  // ─── Categories ────────────────────────────────────────────

  let toysId: string;
  let carsId: string;

  describe('category CRUD', () => {
    it('creates categories with generated, unique slugs', async () => {
      const toys = await http().post('/api/admin/categories').set(auth()).send({ name: 'Toys & Games' }).expect(201);
      expect(toys.body.data).toMatchObject({ slug: 'toys-and-games', isActive: true, productCount: 0 });
      toysId = toys.body.data.id;

      const cars = await http().post('/api/admin/categories').set(auth()).send({ name: 'Cars', parentId: toysId }).expect(201);
      expect(cars.body.data.parent).toEqual({ id: toysId, name: 'Toys & Games' });
      carsId = cars.body.data.id;

      const dup = await http().post('/api/admin/categories').set(auth()).send({ name: 'Cars' }).expect(201);
      expect(dup.body.data.slug).toBe('cars-2');
      await http().delete(`/api/admin/categories/${dup.body.data.id}`).set(auth()).expect(200);
    });

    it('rejects an explicit duplicate slug with 409', async () => {
      const res = await http().post('/api/admin/categories').set(auth()).send({ name: 'Other', slug: 'cars' }).expect(409);
      expect(res.body.errors[0].field).toBe('slug');
    });

    it('limits nesting to two levels', async () => {
      await http().post('/api/admin/categories').set(auth()).send({ name: 'Deep', parentId: carsId }).expect(409);
    });

    it('updates, searches and reorders', async () => {
      await http().put(`/api/admin/categories/${carsId}`).set(auth()).send({ description: 'Fast cars', sortOrder: 3 }).expect(200);
      const list = await http().get('/api/admin/categories?search=car').set(auth()).expect(200);
      expect(list.body.data.items).toHaveLength(1);
      expect(list.body.data.meta).toMatchObject({ page: 1, total: 1, totalPages: 1 });
      await http().patch('/api/admin/categories/reorder').set(auth()).send({ items: [{ id: carsId, sortOrder: 0 }] }).expect(200);
    });

    it('shows active categories as a public tree', async () => {
      const res = await http().get('/api/categories').expect(200);
      expect(res.body.data[0]).toMatchObject({ slug: 'toys-and-games', children: [{ slug: 'cars' }] });
    });
  });

  // ─── Uploads ───────────────────────────────────────────────

  let imageUrl: string;

  describe('image uploads', () => {
    it('converts images to webp', async () => {
      const res = await http()
        .post('/api/admin/uploads/image?folder=products')
        .set(auth())
        .attach('file', await samplePng(), { filename: 'car.png', contentType: 'image/png' })
        .expect(201);
      expect(res.body.data).toMatchObject({ contentType: 'image/webp', width: 40, height: 30 });
      imageUrl = res.body.data.url;
      expect(imageUrl).toMatch(/\/uploads\/products\/\d{4}\/\d{2}\/.+\.webp$/);
      await http().get(new URL(imageUrl).pathname).expect(200).expect('content-type', /image\/webp/);
    });

    it('rejects non-images even with an image MIME type', async () => {
      await http()
        .post('/api/admin/uploads/image')
        .set(auth())
        .attach('file', Buffer.from('definitely not an image'), { filename: 'x.png', contentType: 'image/png' })
        .expect(415);
    });

    it('rejects disallowed MIME types', async () => {
      await http()
        .post('/api/admin/uploads/image')
        .set(auth())
        .attach('file', Buffer.from('%PDF-1.4'), { filename: 'x.pdf', contentType: 'application/pdf' })
        .expect(415);
    });
  });

  // ─── Products ──────────────────────────────────────────────

  let simpleId: string;
  let variantProductId: string;
  let redVariantId: string;

  describe('product CRUD', () => {
    it('creates a simple product', async () => {
      const res = await http()
        .post('/api/admin/products')
        .set(auth())
        .send({
          name: 'Speed Cube',
          categoryId: carsId,
          sku: 'CUBE-1',
          price: 300,
          salePrice: 249,
          stock: 2,
          images: [{ url: imageUrl, alt: 'Cube' }],
          specifications: [{ label: 'Age', value: '6+' }],
        })
        .expect(201);
      expect(res.body.data).toMatchObject({ slug: 'speed-cube', price: 300, salePrice: 249, stock: 2, thumbnailUrl: imageUrl, hasVariants: false });
      simpleId = res.body.data.id;
    });

    it('rejects a sale price above the price (422) and duplicate SKUs (409)', async () => {
      await http().post('/api/admin/products').set(auth()).send({ name: 'Bad', categoryId: carsId, price: 100, salePrice: 150 }).expect(422);
      const dup = await http().post('/api/admin/products').set(auth()).send({ name: 'Dup', categoryId: carsId, price: 100, sku: 'cube-1' }).expect(409);
      expect(dup.body.message).toContain('CUBE-1');
    });

    it('creates a product with options and variants', async () => {
      const res = await http()
        .post('/api/admin/products')
        .set(auth())
        .send({
          name: 'RC Car',
          categoryId: carsId,
          price: 1000,
          salePrice: 900,
          options: [{ name: 'Color', values: ['Red', 'Blue'] }],
          variants: [
            { options: { Color: 'Red' }, sku: 'RC-RED', stock: 3 },
            { options: { Color: 'Blue' }, sku: 'RC-BLUE', stock: 4, price: 1200, salePrice: null },
          ],
        })
        .expect(201);
      const data = res.body.data;
      expect(data).toMatchObject({ hasVariants: true, stock: 7, variantsCount: 2, options: [{ name: 'Color', values: ['Red', 'Blue'] }] });
      variantProductId = data.id;
      redVariantId = data.variants.find((v: { title: string }) => v.title === 'Red').id;

      const pub = await http().get('/api/products/rc-car').expect(200);
      expect(pub.body.data).toMatchObject({ minPrice: 900, maxPrice: 1200 });
      const blue = pub.body.data.variants.find((v: { title: string }) => v.title === 'Blue');
      expect(blue).toMatchObject({ price: 1200, salePrice: null, effectivePrice: 1200, options: { Color: 'Blue' } });
    });

    it('validates variant combinations', async () => {
      const res = await http()
        .post('/api/admin/products')
        .set(auth())
        .send({ name: 'Broken', categoryId: carsId, price: 100, options: [{ name: 'Size', values: ['S'] }], variants: [{ options: { Size: 'XL' }, stock: 1 }] })
        .expect(422);
      expect(res.body.errors[0].field).toBe('variants.0.options');
    });

    it('keeps variant IDs stable when options change', async () => {
      const res = await http()
        .put(`/api/admin/products/${variantProductId}`)
        .set(auth())
        .send({
          options: [{ name: 'Color', values: ['Red', 'Blue', 'Green'] }],
          variants: [
            { options: { Color: 'Red' }, sku: 'RC-RED', stock: 3 },
            { options: { Color: 'Blue' }, sku: 'RC-BLUE', stock: 4, price: 1200 },
            { options: { Color: 'Green' }, sku: 'RC-GREEN', stock: 0 },
          ],
        })
        .expect(200);
      expect(res.body.data.variants).toHaveLength(3);
      expect(res.body.data.variants.find((v: { title: string }) => v.title === 'Red').id).toBe(redVariantId);
    });

    it('filters and searches in admin and storefront', async () => {
      const admin = await http().get('/api/admin/products?search=rc-red').set(auth()).expect(200);
      expect(admin.body.data.items.map((p: { name: string }) => p.name)).toEqual(['RC Car']);
      const low = await http().get('/api/admin/products?stock=low').set(auth()).expect(200);
      expect(low.body.data.items.map((p: { name: string }) => p.name)).toEqual(['Speed Cube']);

      const byOption = await http().get('/api/products?options=Color:Green').expect(200);
      expect(byOption.body.data.items.map((p: { name: string }) => p.name)).toEqual(['RC Car']);
      const byPrice = await http().get('/api/products?maxPrice=500&sort=price_asc').expect(200);
      expect(byPrice.body.data.items.map((p: { name: string }) => p.name)).toEqual(['Speed Cube']);
      const byCategory = await http().get('/api/products?category=toys-and-games').expect(200);
      expect(byCategory.body.data.meta.total).toBe(2);
    });

    it('hides inactive products from the storefront', async () => {
      await http().patch(`/api/admin/products/${simpleId}/status`).set(auth()).send({ isActive: false }).expect(200);
      await http().get('/api/products/speed-cube').expect(404);
      await http().patch(`/api/admin/products/${simpleId}/status`).set(auth()).send({ isActive: true }).expect(200);
      await http().get('/api/products/speed-cube').expect(200);
    });
  });

  // ─── Cart & orders ─────────────────────────────────────────

  const customer = {
    customerName: 'Asha Verma',
    phone: '+91 98250 12345',
    address: '12, Lake View Society, Paldi',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380007',
  };
  let orderNumber: string;

  describe('orders', () => {
    it('validates a cart with live prices and stock', async () => {
      const res = await http()
        .post('/api/cart/validate')
        .send({ items: [{ productId: simpleId, quantity: 5 }, { productId: variantProductId, quantity: 1 }] })
        .expect(200);
      const [cube, car] = res.body.data.items;
      expect(cube).toMatchObject({ status: 'QUANTITY_ADJUSTED', quantity: 2, unitPrice: 249, message: 'Only 2 left in stock' });
      expect(car.status).toBe('VARIANT_REQUIRED');
      expect(res.body.data.hasIssues).toBe(true);
    });

    it('validates order input (422)', async () => {
      const res = await http().post('/api/orders').send({ ...customer, phone: '12345', pincode: 'abc', items: [] }).expect(422);
      const fields = res.body.errors.map((e: { field: string }) => e.field);
      expect(fields).toEqual(expect.arrayContaining(['phone', 'pincode', 'items']));
    });

    it('rejects orders exceeding stock (409) without changing stock', async () => {
      const res = await http().post('/api/orders').send({ ...customer, items: [{ productId: simpleId, quantity: 3 }] }).expect(409);
      expect(res.body.errors[0]).toMatchObject({ field: 'items.0' });
      expect((await prisma.product.findUniqueOrThrow({ where: { id: simpleId } })).stock).toBe(2);
    });

    it('places an order with snapshots, totals and a readable number', async () => {
      const res = await http()
        .post('/api/orders')
        .send({
          ...customer,
          note: 'Ring the bell',
          items: [
            { productId: simpleId, quantity: 1 },
            { productId: variantProductId, variantId: redVariantId, quantity: 2 },
          ],
        })
        .expect(201);
      const order = res.body.data;
      orderNumber = order.orderNumber;
      expect(orderNumber).toMatch(/^KH-\d{8}-0001$/);
      expect(order).toMatchObject({
        status: 'PENDING',
        customerPhone: '9825012345',
        itemsCount: 3,
        subtotal: 300 + 2000,
        discount: 51 + 200,
        total: 249 + 1800,
        paymentMethod: 'CASH_ON_DELIVERY',
      });
      expect(order.items[1]).toMatchObject({ productName: 'RC Car', variantTitle: 'Red', options: [{ name: 'Color', value: 'Red' }], unitPrice: 900 });

      expect((await prisma.product.findUniqueOrThrow({ where: { id: simpleId } })).stock).toBe(1);
      expect((await prisma.productVariant.findUniqueOrThrow({ where: { id: redVariantId } })).stock).toBe(1);
    });

    it('keeps historical prices when the product changes', async () => {
      await http().put(`/api/admin/products/${simpleId}`).set(auth()).send({ name: 'Speed Cube Pro', price: 999, salePrice: null }).expect(200);
      const res = await http().get(`/api/orders/track?orderNumber=${orderNumber}&phone=9825012345`).expect(200);
      expect(res.body.data.items[0]).toMatchObject({ productName: 'Speed Cube', unitPrice: 249, unitMrp: 300 });
      expect(res.body.data.total).toBe(2049);
    });

    it('only lets the matching phone track an order', async () => {
      await http().get(`/api/orders/track?orderNumber=${orderNumber}&phone=9999999999`).expect(404);
    });

    it('never oversells under concurrent checkouts', async () => {
      // Speed Cube now has exactly 1 unit left.
      const attempts = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          http()
            .post('/api/orders')
            .send({ ...customer, phone: `98250${String(10000 + i)}`, items: [{ productId: simpleId, quantity: 1 }] }),
        ),
      );
      const statuses = attempts.map((r) => r.status).sort();
      expect(statuses.filter((s) => s === 201)).toHaveLength(1);
      expect(statuses.filter((s) => s === 409)).toHaveLength(4);
      expect((await prisma.product.findUniqueOrThrow({ where: { id: simpleId } })).stock).toBe(0);

      const numbers = await prisma.order.findMany({ select: { orderNumber: true } });
      expect(new Set(numbers.map((n) => n.orderNumber)).size).toBe(numbers.length);
    });

    it('validates status transitions and records history', async () => {
      await http().patch(`/api/admin/orders/${orderNumber}/status`).set(auth()).send({ status: 'DELIVERED' }).expect(409);
      const res = await http()
        .patch(`/api/admin/orders/${orderNumber}/status`)
        .set(auth())
        .send({ status: 'CONFIRMED', note: 'Confirmed on call' })
        .expect(200);
      expect(res.body.data.status).toBe('CONFIRMED');
      expect(res.body.data.allowedTransitions).toEqual(['PROCESSING', 'READY', 'OUT_FOR_DELIVERY', 'CANCELLED']);
      expect(res.body.data.history.at(-1)).toMatchObject({ fromStatus: 'PENDING', toStatus: 'CONFIRMED', changedByName: 'Owner', note: 'Confirmed on call' });
      expect(res.body.data.contact.callUrl).toBe('tel:+919825012345');
    });

    it('restores stock exactly once when cancelled', async () => {
      await http().patch(`/api/admin/orders/${orderNumber}/status`).set(auth()).send({ status: 'CANCELLED' }).expect(200);
      expect((await prisma.product.findUniqueOrThrow({ where: { id: simpleId } })).stock).toBe(1);
      expect((await prisma.productVariant.findUniqueOrThrow({ where: { id: redVariantId } })).stock).toBe(3);
      // Final state: no further transitions.
      await http().patch(`/api/admin/orders/${orderNumber}/status`).set(auth()).send({ status: 'CONFIRMED' }).expect(409);
      expect((await prisma.product.findUniqueOrThrow({ where: { id: simpleId } })).stock).toBe(1);
    });

    it('lists, filters and counts orders for admins', async () => {
      const list = await http().get('/api/admin/orders?search=9825012345').set(auth()).expect(200);
      expect(list.body.data.items[0]).toMatchObject({ orderNumber, status: 'CANCELLED' });
      const counts = await http().get('/api/admin/orders/status-counts').set(auth()).expect(200);
      expect(counts.body.data).toMatchObject({ ALL: 2, CANCELLED: 1, PENDING: 1 });
      const dash = await http().get('/api/admin/dashboard').set(auth()).expect(200);
      expect(dash.body.data.orders.total).toBe(2);
      expect(dash.body.data.ordersLast14Days).toHaveLength(14);
    });

    it('refuses orders while the store is closed', async () => {
      await http().put('/api/admin/store').set(auth()).send({ isOpen: false, closedMessage: 'Closed for Diwali' }).expect(200);
      const res = await http().post('/api/orders').send({ ...customer, items: [{ productId: simpleId, quantity: 1 }] }).expect(403);
      expect(res.body.message).toBe('Closed for Diwali');
      await http().put('/api/admin/store').set(auth()).send({ isOpen: true }).expect(200);
    });
  });

  // ─── Deletion rules ────────────────────────────────────────

  describe('deletion rules', () => {
    it('archives products referenced by orders and deletes others', async () => {
      const archived = await http().delete(`/api/admin/products/${simpleId}`).set(auth()).expect(200);
      expect(archived.body.data.mode).toBe('archived');
      await http().get(`/api/admin/products/${simpleId}`).set(auth()).expect(404);
      // The SKU is released for reuse.
      const fresh = await http().post('/api/admin/products').set(auth()).send({ name: 'Cube v2', categoryId: carsId, price: 199, sku: 'CUBE-1' }).expect(201);
      const deleted = await http().delete(`/api/admin/products/${fresh.body.data.id}`).set(auth()).expect(200);
      expect(deleted.body.data.mode).toBe('deleted');
      // Old orders remain intact.
      const order = await http().get(`/api/admin/orders/${orderNumber}`).set(auth()).expect(200);
      expect(order.body.data.items[0].productName).toBe('Speed Cube');
    });

    it('does not delete categories that still contain products', async () => {
      await http().delete(`/api/admin/categories/${toysId}`).set(auth()).expect(409); // has sub-category
      const conflict = await http().delete(`/api/admin/categories/${carsId}`).set(auth()).expect(409);
      expect(conflict.body.errors[0].field).toBe('moveProductsTo');

      const target = await http().post('/api/admin/categories').set(auth()).send({ name: 'Vehicles' }).expect(201);
      const moved = await http()
        .delete(`/api/admin/categories/${carsId}?moveProductsTo=${target.body.data.id}`)
        .set(auth())
        .expect(200);
      expect(moved.body.data.movedProducts).toBeGreaterThanOrEqual(2);
      const product = await prisma.product.findUniqueOrThrow({ where: { id: variantProductId } });
      expect(product.categoryId).toBe(target.body.data.id);
    });
  });
});
