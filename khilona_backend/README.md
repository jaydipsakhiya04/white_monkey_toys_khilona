# khilona_backend

REST API for the Khilona shop — NestJS 11 · TypeScript · PostgreSQL · Prisma 6 · JWT.

- Swagger UI: `http://localhost:4000/api/docs` (raw spec: `/api/docs-json`)
- Contract reference: [`../docs/API_CONTRACT.md`](../docs/API_CONTRACT.md)

## Quick start

```bash
cp .env.example .env          # then edit values
npm install

# PostgreSQL: use your own server, `docker compose up -d db` from the repo root,
# or the zero-install embedded server (downloads PostgreSQL 16 binaries, dev only):
npm run db:dev                # keep running in its own terminal

npx prisma migrate deploy     # or `npm run prisma:migrate` while developing the schema
npm run seed                  # demo store, categories, products, admins, demo orders
npm run start:dev             # http://localhost:4000/api
```

### Development credentials (seed)

| Role | Email | Password |
|---|---|---|
| SUPER_ADMIN | `admin@khilona.in` | `Admin@12345` |
| ADMIN | `staff@khilona.in` | `Staff@12345` |

> ⚠️ These are **development-only** credentials. Change the passwords (Admin panel → Profile) or create new admins and deactivate these before going to production.

## Scripts

| Script | Description |
|---|---|
| `npm run start:dev` | Watch mode |
| `npm run build` / `npm start` | Compile to `dist/` and run |
| `npm run db:dev` | Embedded PostgreSQL 16 on port 5432 (data in `.pgdata/`) — dev only |
| `npm run prisma:migrate` | Create/apply a migration (development) |
| `npm run prisma:deploy` | Apply migrations (CI/production) |
| `npm run seed` | Idempotent seed (skips existing records) |
| `npm run prisma:studio` | Browse the database |
| `npm test` | Unit tests |
| `npm run test:e2e` | End-to-end API tests against `khilona_test` database |
| `npm run typecheck` | `tsc --noEmit` |

## Architecture

```
src/
├── auth/            login, rotating refresh tokens (httpOnly cookie), profile, password
├── admins/          admin users (SUPER_ADMIN only)
├── stores/          single-row store configuration (public + admin)
├── categories/      2-level category tree, safe deletion (move products first)
├── products/        catalogue: search/filter/sort, facets, variants, admin CRUD
│   ├── pricing.ts   price / sale / variant resolution + denormalised aggregates
│   └── product.mapper.ts
├── orders/          cart validation, order placement, status workflow, tracking
│   ├── cart-pricing.service.ts   single source of truth for line pricing & availability
│   ├── order-number.service.ts   KH-YYYYMMDD-NNNN (atomic per-day counter)
│   └── order-status.ts           allowed transitions
├── uploads/         image upload → sharp (validate, resize ≤1600px, WebP) → storage provider
│   └── storage/     local disk or any S3-compatible bucket
├── dashboard/       admin statistics (real queries only)
├── notifications/   extension point for WhatsApp / SMS / email channels
├── common/          envelope interceptor, exception filter, validation, guards, utils
├── config/          typed, validated environment configuration
└── database/        PrismaService
prisma/
├── schema.prisma
├── migrations/
├── seed.ts          development data
└── seed-art.ts      generated product illustrations (SVG → WebP)
```

### Response format

```json
{ "success": true, "message": "Product fetched successfully", "data": {} }
{ "success": false, "statusCode": 422, "message": "Validation failed: …", "errors": [{ "field": "phone", "message": "…" }] }
```

Lists return `{ items, meta: { page, limit, total, totalPages, hasNextPage, hasPrevPage } }`.

### Key business rules

- **Prices are never trusted from the client.** `POST /cart/validate` and `POST /orders` re-price every line from the database.
- **Order snapshots.** Order items store name, SKU, options, image, category, MRP and price at purchase time; editing or deleting a product never changes past orders.
- **Stock strategy.** Stock is reserved (decremented) when the order is placed, with conditional updates (`stock >= qty`) inside a transaction so stock can never go negative — verified by a concurrent-checkout test. Cancelling an order restores the stock **once** (`stockRestored` flag). Delivered orders do not change stock.
- **Status lifecycle.** `PENDING → CONFIRMED → PROCESSING → READY → OUT_FOR_DELIVERY → DELIVERED`, forward-only (steps may be skipped, e.g. READY → DELIVERED for pickup). `CANCELLED` is reachable from any open state. Every change is stored in `OrderStatusHistory` with the admin and an optional note. Concurrent updates are rejected (optimistic check on the current status).
- **Order numbers.** `KH-YYYYMMDD-NNNN` in the store timezone (`APP_TIMEZONE`), allocated with `INSERT … ON CONFLICT DO UPDATE … RETURNING` on a per-day counter row inside the order transaction, plus a unique index.
- **Variants.** Products can have option groups (Color, Size, Age…) and variants (combinations) with their own SKU, price override, sale price, stock and image. Variants are matched by option combination on update, so IDs (and carts) stay valid. `Product.stock/minPrice/maxPrice` are maintained aggregates used for fast filtering.
- **Deletion.** Products referenced by orders are archived (soft-deleted, slug/SKU released); others are deleted. Categories with sub-categories cannot be deleted; categories with products require `moveProductsTo`.
- **Guest checkout.** Customers are upserted by phone (`Customer` table) — ready for future accounts.
- **Store closed switch.** When `Store.isOpen = false`, new orders are refused with the configured message.

### Security

Helmet headers, strict CORS allow-list with credentials, global + per-route rate limits (login, orders), bcrypt (cost 12) password hashing with timing-safe failure path, short-lived HS256 access tokens (issuer/audience checked), rotating refresh tokens stored as SHA-256 hashes with reuse detection, admin re-validated from DB on every request (deactivation is immediate), role guard, whitelist DTO validation + input sanitisation, Prisma (parameterised SQL), image content validation via sharp, upload size/type limits, path-traversal-safe local storage, no secrets in responses or logs.

### Environment variables

See [`.env.example`](.env.example). Required: `DATABASE_URL`, `JWT_SECRET` (≥ 32 random chars in production). For S3-compatible storage set `STORAGE_PROVIDER=s3`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY` (+ `STORAGE_ENDPOINT`/`STORAGE_REGION`/`STORAGE_PUBLIC_URL` for R2/MinIO/CDN).

### Tests

```bash
npm test            # unit tests (pure helpers)
npm run test:e2e    # 37 API tests: auth, categories, uploads, products, variants, cart, orders, concurrency, deletion rules
```

The e2e suite uses `TEST_DATABASE_URL` (default `postgresql://postgres:postgres@localhost:5432/khilona_test`), applies migrations automatically and truncates tables before running. Create the database first if your server doesn't have it (`npm run db:dev` creates it automatically).

### Deployment

```bash
docker build -t khilona-api .
docker run -p 4000:4000 --env-file .env khilona-api   # runs `prisma migrate deploy` then starts
```

Behind a proxy set `TRUST_PROXY=true`. Use `COOKIE_SECURE=true` with HTTPS. If the admin panel is served from a different *site* than the API (not just a different subdomain), set `COOKIE_SAMESITE=none` (requires HTTPS). With local storage, mount a persistent volume at `/app/uploads`, or switch to S3-compatible storage.
