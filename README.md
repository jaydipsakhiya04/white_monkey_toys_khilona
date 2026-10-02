# WHITE MONKEY TOYS — Toy Store Platform (project: Khilona)

A complete premium toy-store platform. The customer-facing brand is **White Monkey Toys**; *Khilona* is the internal project/repository name.

Customers browse the catalogue and place **pay-on-delivery orders** — as a guest or with an optional **customer account** (order history, live tracking, invoice & receipt PDFs, verified-purchase reviews). The shop team manages the catalogue, store settings, orders and review moderation from a separate admin panel.

```
                ┌────────────────────┐
                │   PostgreSQL 16    │
                └─────────▲──────────┘
                          │ Prisma
                ┌─────────┴──────────┐
                │  khilona_backend   │  NestJS REST API  :4000  (/api, /api/docs)
                └───────▲─────▲──────┘
              ┌─────────┘     └─────────┐
      ┌───────┴────────┐       ┌────────┴────────┐
      │ khilona_       │       │ khilona_        │
      │ userpanel      │       │ adminpanel      │
      │ Storefront     │       │ Back-office     │
      │ Next.js :3000  │       │ Next.js :3001   │
      └────────────────┘       └─────────────────┘
```

All business logic (pricing, stock, order numbers, status transitions, validation) lives in the backend. The two Next.js apps are independent, separately deployable clients.

No payment gateway and no delivery-partner integration by design — orders are confirmed and fulfilled manually. The architecture leaves clear extension points for both (see *Future extensibility*).

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| API | **NestJS 11**, TypeScript | Modular, DI, first-class validation & Swagger |
| Database | **PostgreSQL 16** + **Prisma 6** | Relational integrity, migrations, typed queries, `pg_trgm` search indexes |
| Auth | JWT access token (15 min) + rotating refresh token in httpOnly cookie, bcrypt | Token never in localStorage; reuse detection; role-based guards |
| Validation | class-validator / class-transformer (API), Zod + React Hook Form (UIs) | Same rules enforced server-side, mirrored client-side for UX |
| Images | multer + **sharp** → WebP, local disk or **S3-compatible** storage | Content-validated, resized, small; swap storage with one env var |
| Frontends | **Next.js 15 (App Router)**, React 19, **Tailwind CSS 4**, **TanStack Query 5** | SSR/ISR for SEO on the storefront; fast client UX in admin |
| Testing | Jest + Supertest (API), Playwright (UI flows) | |
| API docs | Swagger / OpenAPI at `/api/docs` | |

> Versions: Node 20.14 is the baseline used here. Prisma 7+ requires Node ≥ 20.19, so the stable Prisma 6 line is used; Next 15.5 / Nest 11 are the mature majors.

---

## Repository structure

```
khilona/
├── khilona_backend/        NestJS API (+ Prisma schema, migrations, seed, tests)
├── khilona_userpanel/      Customer storefront (Next.js)
├── khilona_adminpanel/     Admin dashboard (Next.js)
├── docs/API_CONTRACT.md    Endpoint & type reference shared by all apps
├── docker-compose.yml      PostgreSQL (+ optional API container)
├── package.json            Convenience scripts (no workspaces; apps stay independent)
└── README.md
```

Each app has its own README with details.

---

## Getting started (local)

### 1. Prerequisites
- Node.js ≥ 20 and npm
- PostgreSQL 16 — **any one of**:
  - your own server,
  - `docker compose up -d db`,
  - or the zero-install embedded server: `npm run db:dev` (downloads real PostgreSQL binaries into `khilona_backend/node_modules`, data in `khilona_backend/.pgdata`; dev only).

### 2. Install
```bash
npm run install:all
```

### 3. Environment
```bash
cp khilona_backend/.env.example     khilona_backend/.env
cp khilona_userpanel/.env.example   khilona_userpanel/.env.local
cp khilona_adminpanel/.env.example  khilona_adminpanel/.env.local
```
Defaults work for local development (API :4000, storefront :3000, admin :3001).

### 4. Database: migrate + seed
```bash
npm run db:dev        # only if you use the embedded PostgreSQL — keep this terminal open
npm run db:setup      # prisma migrate deploy + seed
```

### 5. Run (three terminals)
```bash
npm run dev:api       # http://localhost:4000/api   · Swagger: http://localhost:4000/api/docs
npm run dev:user      # http://localhost:3000
npm run dev:admin     # http://localhost:3001
```

### Seed credentials (development only)

| Role | Email | Password |
|---|---|---|
| SUPER_ADMIN | `admin@khilona.in` | `Admin@12345` |
| ADMIN | `staff@khilona.in` | `Staff@12345` |
| Storefront customer (demo) | `demo@whitemonkeytoys.in` (mobile `9811122233`) | `Demo@12345` |

The demo customer has three account orders (two delivered, with verified reviews) so *My Account*, documents and product reviews have content. Skipped when `SEED_DEMO_ORDERS=false` or in production.

> ⚠️ **Change these before production.** Create real admin accounts (Admin → Settings → Admin users), then deactivate the seeded ones, or change their passwords from the Profile page.

The seed creates the store profile (logo, hero, hours, policies), 11 categories (with sub-categories), 25 products (several with Color / Size / Age / Pack variants, some low/out of stock, one inactive), generated product illustrations, and five demo orders in different statuses so the admin panel is populated on first run (set `SEED_DEMO_ORDERS=false` to skip). It is idempotent.

---

## Environment variables

### Backend (`khilona_backend/.env`)
| Variable | Example | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/khilona?schema=public` | required |
| `JWT_SECRET` | 48+ random chars | required; ≥ 32 chars enforced in production |
| `JWT_EXPIRES_IN` | `15m` | access token lifetime |
| `REFRESH_TOKEN_TTL_DAYS` | `7` | admin refresh token |
| `CUSTOMER_REFRESH_TOKEN_TTL_DAYS` | `30` | storefront account refresh token |
| `PASSWORD_RESET_TTL_MINUTES` | `30` | lifetime of a password-reset link |
| `STOREFRONT_URL` | `http://localhost:3000` | used to build password-reset links |
| `CORS_ORIGIN` | `http://localhost:3000,http://localhost:3001` | comma-separated allow-list |
| `APP_URL` | `http://localhost:4000` | public API base (used for local upload URLs) |
| `COOKIE_SECURE` / `COOKIE_SAMESITE` / `COOKIE_DOMAIN` | `true` / `lax` / `.khilona.in` | refresh-token cookie |
| `APP_TIMEZONE` | `Asia/Kolkata` | order-number dates, opening hours, reports |
| `ORDER_NUMBER_PREFIX` | `WMT` | new orders look like `WMT-20261002-0001`; existing orders keep their numbers |
| `STORAGE_PROVIDER` | `local` \| `s3` | |
| `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_PUBLIC_URL` | | for S3 / R2 / MinIO / Spaces |
| `UPLOAD_MAX_FILE_SIZE_MB` | `5` | |
| `THROTTLE_GLOBAL_LIMIT`, `THROTTLE_LOGIN_LIMIT`, `THROTTLE_ORDER_LIMIT`, `THROTTLE_TRACK_LIMIT` | `300`, `5`, `10`, `20` | requests / minute / IP (login limit also covers customer signup / password reset; track limit covers guest tracking & guest documents) |
| `TRUST_PROXY`, `SWAGGER_ENABLED` | `true`, `false` | |

### User panel (`khilona_userpanel/.env.local`)
| Variable | Example |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` (canonical URLs, sitemap, OG) |
| `API_URL` *(optional)* | internal API URL for server-side rendering |
| `NEXT_PUBLIC_IMAGE_HOSTS` *(optional)* | extra image hosts (CDN / bucket) |

### Admin panel (`khilona_adminpanel/.env.local`)
| Variable | Example |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` |
| `NEXT_PUBLIC_STOREFRONT_URL` *(optional)* | `http://localhost:3000` ("View on store" links) |

---

## Business rules (summary)

- **Guest checkout** — name, mobile, address, city/state/pincode, landmark, Google Maps link, browser location (optional) and notes. Never requires an account.
- **Customer accounts** — signup / login (email or mobile) / logout / password change. JWT access token kept in memory only + rotating httpOnly refresh cookie (`wmt_crt`, separate JWT audience from admins). Orders placed while signed in are linked to the account.
- **Guest → account** — mobile numbers are not verified, so signing up never exposes earlier guest orders automatically. A customer can *claim* an earlier guest order with its order number when it was placed with the account's mobile — the same proof guest tracking already requires. A guest checkout using an account's mobile never overwrites that account's details.
- **Password reset** — single-use, hashed, 30-minute tokens. No email/SMS provider ships with the project: the API reports `deliveryAvailable: false` and the storefront honestly tells the customer to contact the store. Register a `NotificationChannel` with `passwordResetRequested` to deliver links (in development the link is logged to the API console).
- **Order ownership** — every `/customer/*` order, invoice and receipt route checks ownership server-side; another customer's order number returns 404.
- **Customer cancellation** — allowed only while an order is still `PENDING` (stock is restored exactly once, same routine as admin cancellation).
- **Reviews** — verified purchase only: signed-in owner + order contains the product + order `DELIVERED` + one review per customer/product/order. Eligibility is decided by the API. Optional moderation (`reviewsRequireApproval`); admins can publish/hide but never edit ratings or text. Product cards/pages show average, count and distribution.
- **Invoice & receipt PDFs** — generated on demand (pdfkit + bundled Inter font for ₹) purely from order snapshots, so old documents stay correct after products change. Invoice number = order number with an `INV-` prefix.
- **Prices & stock are re-validated server-side** for every cart view and order.
- **Order item snapshots** — name, SKU, options, image, MRP and price at purchase time. Later product edits/deletion never alter past orders.
- **Stock** — reserved when the order is placed (atomic, never negative; concurrency-tested); restored exactly once when an order is cancelled.
- **Order numbers** — `PREFIX-YYYYMMDD-NNNN` (prefix `WMT` by default), collision-safe per-day counter shared across prefixes.
- **Order lifecycle** — `PENDING → CONFIRMED → PROCESSING → READY → OUT_FOR_DELIVERY → DELIVERED`, forward-only, `CANCELLED` from any open state, full history with who/when/note.
- **Deletion safety** — products with orders are archived instead of deleted; categories with products require moving the products first; categories with sub-categories cannot be deleted.
- **Store switch** — when the store is set to closed, ordering is paused with a custom message.

---

## Testing

```bash
npm run test:api          # backend unit (21) + e2e (58: catalogue/orders + customer accounts, ownership, reviews, PDFs) — needs PostgreSQL running
npm run test:e2e:user     # Playwright (24 tests, desktop + Pixel 7): purchase flow, errors, SEO, filters, signup → signed-in checkout → My Orders → receipt PDF → logout
npm run test:e2e:admin    # Playwright (5 tests): auth, login → create category → create product (image upload) → order → status change
npm run lint
npm run build
```

The UI end-to-end suites expect the API to be running with seed data (`npm run dev:api`). They create real orders and then clean up after themselves (orders are cancelled so stock is restored; test products/categories are deactivated). Set `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` if you changed the seed credentials.

---

## Production deployment

Each app deploys independently.

1. **Database** — managed PostgreSQL 16 (Neon, RDS, Supabase, Cloud SQL…). Enable the `pg_trgm` extension (the first migration does `CREATE EXTENSION IF NOT EXISTS pg_trgm`).
2. **API** — `khilona_backend/Dockerfile` (runs `prisma migrate deploy` on start) on Render, Railway, Fly.io, ECS, a VPS… Set a strong `JWT_SECRET`, `NODE_ENV=production`, `COOKIE_SECURE=true`, `TRUST_PROXY=true` behind a load balancer, `CORS_ORIGIN` to the real storefront/admin origins, and prefer `STORAGE_PROVIDER=s3` (or mount a persistent volume for `uploads/`).
3. **Storefront & admin** — Vercel, Netlify, or `next build && next start` behind Nginx. Set `NEXT_PUBLIC_API_URL` (and `NEXT_PUBLIC_SITE_URL` for the storefront) at build time.
4. **Domains** — e.g. `khilona.in` (storefront), `admin.khilona.in`, `api.khilona.in`. Keeping admin and API on the same registrable domain lets the refresh cookie work with `SameSite=Lax`; otherwise use `COOKIE_SAMESITE=none` over HTTPS.
5. **After first deploy** — run the seed only if you want demo data (`SEED_DEMO_ORDERS=false` for production), or create the first SUPER_ADMIN manually, then **change all default passwords**.

---

## Future extensibility

| Feature | Where it plugs in |
|---|---|
| Online payments | `PaymentMethod` / `PaymentStatus` enums on `Order`; add a `payments` module and a pre-confirmation step |
| Delivery partners | new module consuming order status changes; `shippingFee` already on `Order` |
| WhatsApp / SMS / email | implement a `NotificationChannel` and register it in `NotificationsService` (already called on order placed / status changed) |
| Customer accounts | ✅ implemented (signup/login, My Account, documents, reviews) |
| Password-reset delivery | register a `NotificationChannel` implementing `passwordResetRequested` (email / SMS / WhatsApp) |
| Coupons, GST | `Order.discount`/`shippingFee` totals are server-computed in one place (`CartPricingService`) |
| Multiple admins / permissions | `AdminRole` enum + `@AdminAuth(...roles)` guard |
| Wishlist, reports | new modules; catalogue IDs and slugs are stable |
