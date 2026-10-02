import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/database/prisma.service';
import { createApp, login, resetDatabase, seedBasics } from './helpers';

/**
 * Customer accounts, order ownership, verified-purchase reviews and PDF documents.
 */
describe('Customer accounts (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let productId: string;
  let productSlug: string;
  let otherProductId: string;
  const http = () => request(app.getHttpServer());
  const admin = () => ({ Authorization: `Bearer ${adminToken}` });
  const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });

  const A = { name: 'Asha Verma', email: 'asha@example.com', phone: '9876500001', password: 'Toys2026a' };
  const B = { name: 'Bharat Rao', email: 'bharat@example.com', phone: '9876500002', password: 'Toys2026b' };
  let tokenA: string;
  let cookieA: string;
  let tokenB: string;

  const address = { address: '12 Test Lane, Navrangpura', city: 'Ahmedabad', state: 'Gujarat', pincode: '380009' };
  const placeOrder = (token: string | null, phone: string, items = [{ productId, quantity: 1 }]) => {
    const req = http().post('/api/orders');
    if (token) req.set(bearer(token));
    return req.send({ customerName: 'Order Person', phone, ...address, items });
  };
  const setStatus = (orderNumber: string, status: string) =>
    http().patch(`/api/admin/orders/${orderNumber}/status`).set(admin()).send({ status }).expect(200);
  /** Moves an order forward to DELIVERED from wherever it currently is. */
  const deliver = async (orderNumber: string) => {
    const flow = ['PENDING', 'CONFIRMED', 'READY', 'DELIVERED'];
    const current = (await http().get(`/api/admin/orders/${orderNumber}`).set(admin()).expect(200)).body.data.status as string;
    const from = current === 'PROCESSING' ? 1 : flow.indexOf(current);
    for (const s of flow.slice(from + 1)) await setStatus(orderNumber, s);
  };
  const refreshCookie = (res: request.Response) =>
    ([] as string[]).concat(res.headers['set-cookie'] ?? []).find((c) => c.startsWith('wmt_crt='))?.split(';')[0];

  beforeAll(async () => {
    ({ app, prisma } = await createApp());
    await resetDatabase(prisma);
    await seedBasics(prisma);
    adminToken = (await login(app)).token;
    const cat = await http().post('/api/admin/categories').set(admin()).send({ name: 'Puzzles' }).expect(201);
    const p1 = await http()
      .post('/api/admin/products')
      .set(admin())
      .send({ name: 'Jigsaw 500', categoryId: cat.body.data.id, sku: 'JIG-500', price: 500, salePrice: 450, stock: 50 })
      .expect(201);
    productId = p1.body.data.id;
    productSlug = p1.body.data.slug;
    const p2 = await http()
      .post('/api/admin/products')
      .set(admin())
      .send({ name: 'Floor Puzzle', categoryId: cat.body.data.id, price: 300, stock: 50 })
      .expect(201);
    otherProductId = p2.body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Authentication ──────────────────────────────────────

  describe('authentication', () => {
    it('signs up, sets an httpOnly refresh cookie and never exposes the hash', async () => {
      const res = await http().post('/api/auth/customer/signup').send(A).expect(201);
      expect(res.body.data.customer).toMatchObject({ name: A.name, email: A.email, phone: A.phone });
      expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
      const cookie = ([] as string[]).concat(res.headers['set-cookie']).find((c) => c.startsWith('wmt_crt='))!;
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/Path=\/api\/auth\/customer/);
      tokenA = res.body.data.accessToken;
      cookieA = cookie.split(';')[0];
      tokenB = (await http().post('/api/auth/customer/signup').send(B).expect(201)).body.data.accessToken;
    });

    it('rejects duplicate email and duplicate mobile with field errors', async () => {
      const res = await http().post('/api/auth/customer/signup').send({ ...A, name: 'Someone' }).expect(409);
      expect(res.body.errors.map((e: { field: string }) => e.field)).toEqual(expect.arrayContaining(['email', 'phone']));
    });

    it('validates signup input (422)', async () => {
      const res = await http().post('/api/auth/customer/signup').send({ name: 'X', email: 'nope', phone: '123', password: 'short' }).expect(422);
      expect(res.body.errors.map((e: { field: string }) => e.field)).toEqual(expect.arrayContaining(['name', 'email', 'phone', 'password']));
    });

    it('logs in with email or mobile; wrong password is 401 with a generic message', async () => {
      await http().post('/api/auth/customer/login').send({ identifier: A.email, password: A.password }).expect(200);
      await http().post('/api/auth/customer/login').send({ identifier: `+91 ${A.phone}`, password: A.password }).expect(200);
      const bad = await http().post('/api/auth/customer/login').send({ identifier: A.email, password: 'Wrong12345' }).expect(401);
      expect(bad.body.message).toBe('Email/mobile or password is incorrect');
      await http().post('/api/auth/customer/login').send({ identifier: 'ghost@example.com', password: 'Wrong12345' }).expect(401);
    });

    it('protects customer routes and keeps admin/customer tokens separate', async () => {
      await http().get('/api/customer/profile').expect(401);
      await http().get('/api/customer/profile').set(bearer('not-a-token')).expect(401);
      await http().get('/api/customer/profile').set(admin()).expect(401);
      await http().get('/api/admin/orders').set(bearer(tokenA)).expect(401);
      const me = await http().get('/api/customer/profile').set(bearer(tokenA)).expect(200);
      expect(me.body.data.email).toBe(A.email);
    });

    it('rejects expired access tokens', async () => {
      const jwt = app.get((await import('@nestjs/jwt')).JwtService);
      const expired = await jwt.signAsync({ sub: 'x', type: 'customer' }, { audience: 'khilona-customer', expiresIn: -10 });
      const res = await http().get('/api/customer/profile').set(bearer(expired)).expect(401);
      expect(res.body.message).toBe('Session expired');
    });

    it('rotates the refresh token, detects reuse and logs out', async () => {
      const first = await http().post('/api/auth/customer/refresh').set('Cookie', cookieA).expect(200);
      const rotated = refreshCookie(first)!;
      expect(rotated).not.toBe(cookieA);
      await http().post('/api/auth/customer/refresh').set('Cookie', cookieA).expect(401); // reuse → all sessions revoked
      await http().post('/api/auth/customer/refresh').set('Cookie', rotated).expect(401);
      const fresh = await http().post('/api/auth/customer/login').send({ identifier: A.email, password: A.password }).expect(200);
      cookieA = refreshCookie(fresh)!;
      tokenA = fresh.body.data.accessToken;
      await http().post('/api/auth/customer/logout').set('Cookie', cookieA).expect(200);
      await http().post('/api/auth/customer/refresh').set('Cookie', cookieA).expect(401);
    });

    it('resets a password with a single-use token and never reveals whether an account exists', async () => {
      const unknown = await http().post('/api/auth/customer/forgot-password').send({ identifier: 'nobody@example.com' }).expect(200);
      const known = await http().post('/api/auth/customer/forgot-password').send({ identifier: A.email }).expect(200);
      expect(known.body).toEqual(unknown.body);
      expect(known.body.data).toEqual({ deliveryAvailable: false });

      // No delivery channel in tests: create a token the same way the service does.
      const { createHash, randomBytes } = await import('node:crypto');
      const token = randomBytes(32).toString('base64url');
      const customer = await prisma.customer.findUniqueOrThrow({ where: { accountEmail: A.email } });
      await prisma.customerPasswordReset.create({
        data: { customerId: customer.id, tokenHash: createHash('sha256').update(token).digest('hex'), expiresAt: new Date(Date.now() + 60_000) },
      });
      await http().post('/api/auth/customer/reset-password').send({ token, password: 'NewToys2026' }).expect(200);
      await http().post('/api/auth/customer/reset-password').send({ token, password: 'Another2026' }).expect(400);
      await http().post('/api/auth/customer/login').send({ identifier: A.email, password: A.password }).expect(401);
      const res = await http().post('/api/auth/customer/login').send({ identifier: A.email, password: 'NewToys2026' }).expect(200);
      tokenA = res.body.data.accessToken;
      A.password = 'NewToys2026';
    });
  });

  // ─── Orders & ownership ──────────────────────────────────

  describe('orders', () => {
    let orderA: string;
    let orderB: string;

    it('links signed-in orders to the account; guest checkout still works', async () => {
      const res = await placeOrder(tokenA, A.phone).expect(201);
      expect(res.body.data.linkedToAccount).toBe(true);
      orderA = res.body.data.orderNumber;
      orderB = (await placeOrder(tokenB, B.phone).expect(201)).body.data.orderNumber;

      const guest = await placeOrder(null, '9123400009').expect(201);
      expect(guest.body.data.linkedToAccount).toBe(false);
      await http().get('/api/orders/track').query({ orderNumber: guest.body.data.orderNumber, phone: '9123400009' }).expect(200);
    });

    it('server-prices signed-in orders too', async () => {
      const res = await http()
        .post('/api/orders')
        .set(bearer(tokenA))
        .send({ customerName: 'Asha', phone: A.phone, ...address, items: [{ productId, quantity: 2, price: 1 }] })
        .expect(201);
      expect(res.body.data.total).toBe(900);
    });

    it('customer A sees own orders only', async () => {
      const list = await http().get('/api/customer/orders').set(bearer(tokenA)).expect(200);
      const numbers = list.body.data.items.map((o: { orderNumber: string }) => o.orderNumber);
      expect(numbers).toContain(orderA);
      expect(numbers).not.toContain(orderB);
      await http().get(`/api/customer/orders/${orderA}`).set(bearer(tokenA)).expect(200);
      await http().get(`/api/customer/orders/${orderB}`).set(bearer(tokenA)).expect(404);
      const summary = await http().get('/api/customer/orders/summary').set(bearer(tokenA)).expect(200);
      expect(summary.body.data).toMatchObject({ totalOrders: 2, activeOrders: 2, deliveredOrders: 0 });
    });

    it('a guest checkout with an account’s mobile neither shows in that account nor overwrites its name', async () => {
      const res = await http().post('/api/orders').send({ customerName: 'Impostor', phone: A.phone, ...address, items: [{ productId, quantity: 1 }] }).expect(201);
      const list = await http().get('/api/customer/orders').set(bearer(tokenA)).expect(200);
      expect(list.body.data.items.map((o: { orderNumber: string }) => o.orderNumber)).not.toContain(res.body.data.orderNumber);
      const me = await http().get('/api/customer/profile').set(bearer(tokenA)).expect(200);
      expect(me.body.data.name).toBe(A.name);
    });

    it('claims an earlier guest order only with the matching mobile', async () => {
      const guestForA = (await placeOrder(null, A.phone).expect(201)).body.data.orderNumber;
      const guestOther = (await placeOrder(null, '9123400010').expect(201)).body.data.orderNumber;
      await http().post('/api/customer/orders/claim').set(bearer(tokenA)).send({ orderNumber: guestOther }).expect(404);
      await http().post('/api/customer/orders/claim').set(bearer(tokenA)).send({ orderNumber: orderB }).expect(404);
      await http().post('/api/customer/orders/claim').set(bearer(tokenA)).send({ orderNumber: guestForA }).expect(200);
      await http().get(`/api/customer/orders/${guestForA}`).set(bearer(tokenA)).expect(200);
      await http().post('/api/customer/orders/claim').set(bearer(tokenA)).send({ orderNumber: guestForA }).expect(409);
    });

    it('lets the owner cancel only while pending, restoring stock', async () => {
      const before = (await prisma.product.findUniqueOrThrow({ where: { id: otherProductId } })).stock;
      const n = (await placeOrder(tokenA, A.phone, [{ productId: otherProductId, quantity: 3 }]).expect(201)).body.data.orderNumber;
      await http().post(`/api/customer/orders/${n}/cancel`).set(bearer(tokenB)).send({}).expect(404);
      const res = await http().post(`/api/customer/orders/${n}/cancel`).set(bearer(tokenA)).send({ reason: 'Changed my mind' }).expect(200);
      expect(res.body.data.status).toBe('CANCELLED');
      expect((await prisma.product.findUniqueOrThrow({ where: { id: otherProductId } })).stock).toBe(before);

      await setStatus(orderA, 'CONFIRMED');
      await http().post(`/api/customer/orders/${orderA}/cancel`).set(bearer(tokenA)).send({}).expect(409);
    });

    // ─── Documents ─────────────────────────────────────────

    it('downloads own invoice and receipt as PDFs with historical totals', async () => {
      // change the live product afterwards: documents must keep the purchase-time snapshot
      await http().put(`/api/admin/products/${productId}`).set(admin()).send({ name: 'Jigsaw 500 (new box)', price: 999, salePrice: null }).expect(200);
      const inv = await http().get(`/api/customer/orders/${orderA}/invoice`).set(bearer(tokenA)).buffer(true).parse(binary).expect(200);
      expect(inv.headers['content-type']).toBe('application/pdf');
      expect(inv.headers['content-disposition']).toBe(`attachment; filename="white-monkey-toys-test-invoice-${orderA}.pdf"`);
      expect((inv.body as Buffer).subarray(0, 4).toString()).toBe('%PDF');
      const rec = await http().get(`/api/customer/orders/${orderA}/receipt`).set(bearer(tokenA)).buffer(true).parse(binary).expect(200);
      expect((rec.body as Buffer).subarray(0, 4).toString()).toBe('%PDF');

      const detail = await http().get(`/api/customer/orders/${orderA}`).set(bearer(tokenA)).expect(200);
      expect(detail.body.data.items[0]).toMatchObject({ productName: 'Jigsaw 500', unitPrice: 450, unitMrp: 500 });
      expect(detail.body.data.total).toBe(450);
    });

    it('blocks documents of other customers and unauthenticated access', async () => {
      await http().get(`/api/customer/orders/${orderA}/invoice`).set(bearer(tokenB)).expect(404);
      await http().get(`/api/customer/orders/${orderA}/receipt`).set(bearer(tokenB)).expect(404);
      await http().get(`/api/customer/orders/${orderA}/invoice`).expect(401);
      await http().post('/api/orders/track/invoice').send({ orderNumber: orderA, phone: '9000000009' }).expect(404);
      await http().post('/api/orders/track/receipt').send({ orderNumber: orderA, phone: A.phone }).buffer(true).parse(binary).expect(200);
    });

    // ─── Reviews ───────────────────────────────────────────

    describe('reviews', () => {
      it('refuses reviews before delivery (pending / processing)', async () => {
        await http().post('/api/customer/reviews').set(bearer(tokenB)).send({ orderNumber: orderB, productId, rating: 5 }).expect(403);
        await setStatus(orderB, 'CONFIRMED');
        await setStatus(orderB, 'PROCESSING');
        await http().post('/api/customer/reviews').set(bearer(tokenB)).send({ orderNumber: orderB, productId, rating: 5 }).expect(403);
      });

      it('refuses non-purchasers and products outside the order', async () => {
        await deliver(orderA);
        await http().post('/api/customer/reviews').set(bearer(tokenB)).send({ orderNumber: orderA, productId, rating: 5 }).expect(404);
        await http().post('/api/customer/reviews').set(bearer(tokenA)).send({ orderNumber: orderA, productId: otherProductId, rating: 5 }).expect(403);
        await http().post('/api/customer/reviews').send({ orderNumber: orderA, productId, rating: 5 }).expect(401);
      });

      it('lets the delivered purchaser review once; shows it as a verified purchase', async () => {
        const detail = await http().get(`/api/customer/orders/${orderA}`).set(bearer(tokenA)).expect(200);
        expect(detail.body.data.items[0]).toMatchObject({ canReview: true, review: null });

        await http().post('/api/customer/reviews').set(bearer(tokenA)).send({ orderNumber: orderA, productId, rating: 6 }).expect(422);
        const res = await http()
          .post('/api/customer/reviews')
          .set(bearer(tokenA))
          .send({ orderNumber: orderA, productId, rating: 4, comment: 'Great pieces' })
          .expect(201);
        expect(res.body.data.status).toBe('APPROVED');
        await http().post('/api/customer/reviews').set(bearer(tokenA)).send({ orderNumber: orderA, productId, rating: 5 }).expect(409);

        const after = await http().get(`/api/customer/orders/${orderA}`).set(bearer(tokenA)).expect(200);
        expect(after.body.data.items[0]).toMatchObject({ canReview: false, review: { rating: 4 } });

        const pub = await http().get(`/api/products/${productSlug}/reviews`).expect(200);
        expect(pub.body.data.summary).toMatchObject({ average: 4, count: 1 });
        expect(pub.body.data.items[0]).toMatchObject({ authorName: 'Asha V.', verifiedPurchase: true, comment: 'Great pieces' });
        expect(JSON.stringify(pub.body)).not.toContain(A.phone);
        const card = await http().get('/api/products').query({ search: 'Jigsaw' }).expect(200);
        expect(card.body.data.items[0].rating).toEqual({ average: 4, count: 1 });
      });

      it('only the author can edit or delete; admins can hide but not edit', async () => {
        const mine = await http().get('/api/customer/reviews').set(bearer(tokenA)).expect(200);
        const id = mine.body.data.items[0].id;
        await http().patch(`/api/customer/reviews/${id}`).set(bearer(tokenB)).send({ rating: 1 }).expect(404);
        await http().delete(`/api/customer/reviews/${id}`).set(bearer(tokenB)).expect(404);
        await http().patch(`/api/customer/reviews/${id}`).set(bearer(tokenA)).send({ rating: 5 }).expect(200);

        await http().patch(`/api/admin/reviews/${id}/status`).set(admin()).send({ status: 'HIDDEN', rating: 1 }).expect(200);
        const hidden = await prisma.review.findUniqueOrThrow({ where: { id } });
        expect(hidden).toMatchObject({ status: 'HIDDEN', rating: 5 });
        await http().patch(`/api/admin/reviews/${id}/status`).set(admin()).send({ status: 'PENDING' }).expect(422);
        expect((await http().get(`/api/products/${productSlug}/reviews`).expect(200)).body.data.summary.count).toBe(0);
        const list = await http().get('/api/admin/reviews').set(admin()).expect(200);
        expect(list.body.data.statusCounts).toMatchObject({ ALL: 1, HIDDEN: 1 });
        await http().get('/api/admin/reviews').set(bearer(tokenA)).expect(401);
      });

      it('holds new reviews for approval when the store requires it', async () => {
        await prisma.store.updateMany({ data: { reviewsRequireApproval: true } });
        await deliver(orderB);
        const res = await http().post('/api/customer/reviews').set(bearer(tokenB)).send({ orderNumber: orderB, productId, rating: 3 }).expect(201);
        expect(res.body.data.status).toBe('PENDING');
        expect((await http().get(`/api/products/${productSlug}/reviews`).expect(200)).body.data.summary.count).toBe(0);
        await http().patch(`/api/admin/reviews/${res.body.data.id}/status`).set(admin()).send({ status: 'APPROVED' }).expect(200);
        expect((await http().get(`/api/products/${productSlug}/reviews`).expect(200)).body.data.summary.count).toBe(1);
        await prisma.store.updateMany({ data: { reviewsRequireApproval: false } });
      });
    });
  });
});

/** supertest parser that collects a binary body into a Buffer. */
function binary(res: request.Response, cb: (err: Error | null, body: Buffer) => void) {
  const chunks: Buffer[] = [];
  const stream = res as unknown as NodeJS.ReadableStream;
  stream.on('data', (c: Buffer) => chunks.push(c));
  stream.on('end', () => cb(null, Buffer.concat(chunks)));
}
