# KHILONA Admin Panel

Management dashboard for the KHILONA toy & games shop: orders, products (with variants), categories, store settings, storefront content and admin users.

Built with Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, TanStack Query v5, React Hook Form + zod, dnd-kit, lucide-react and sonner. It talks only to the KHILONA REST API described in `../docs/API_CONTRACT.md`.

## Setup

```bash
npm install
cp .env.example .env.local   # then adjust if needed
npm run dev                  # http://localhost:3001
```

The backend must be running (default `http://localhost:4000/api`). Check it with `curl http://localhost:4000/api/health`.

Dev credentials (seeded by the backend): `admin@khilona.in` / `Admin@12345` (SUPER_ADMIN).

## Environment variables

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | yes | `http://localhost:4000/api` | Base URL of the REST API (includes `/api`) |
| `NEXT_PUBLIC_STOREFRONT_URL` | no | `http://localhost:3000` | Enables "View on store" links (`/product/<slug>`) |
| `NEXT_PUBLIC_IMAGE_HOSTS` | no | `localhost` | Informational; the admin renders images with plain `<img>` so any host works |

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server on port 3001 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build on port 3001 |
| `npm run lint` | ESLint (next/core-web-vitals + typescript) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:e2e` | Playwright end-to-end tests (starts `npm run start` if nothing is listening on 3001) |
| `node scripts/screenshots.mjs [outDir]` | Responsive review: full-page screenshots of key screens at 320–1920 px and a horizontal-overflow report (app + API must be running) |

## Structure

```
app/
  (auth)/login/           sign-in page
  (dashboard)/            protected route group (client AuthGuard + AppShell)
    page.tsx              dashboard
    orders/ orders/[id]/  order list & detail
    products/ products/new/ products/[id]/
    categories/ store/ settings/ profile/
  layout.tsx providers.tsx robots.ts not-found.tsx error.tsx global-error.tsx
components/
  ui/       Button, Input/Textarea/Select, Field, Switch, Checkbox, Badge (order/payment/stock),
            Dialog/ConfirmDialog/Sheet, DropdownMenu, Tabs/Segmented, Table, Pagination,
            Skeleton/EmptyState/ErrorState/Card/Thumb, ImageUploader, TagInput, PageHeader
  layout/   AppShell (sidebar, tablet rail, mobile top bar + bottom nav + "More" drawer), brand
features/   auth, dashboard, orders, products, categories, store, settings, admins
hooks/      use-focus-trap, use-url-state, use-debounce, use-unsaved-changes
lib/        api-client (envelope unwrap, ApiError, single-flight refresh, XHR upload with progress),
            session (in-memory token holder), query-client, query-keys, form-errors, env
services/   typed wrappers for every endpoint
types/      API contract types
utils/      currency (en-IN, INR) / dates (Asia/Kolkata), slugify, status labels & colours, url helpers
e2e/        Playwright specs + fixtures
```

## Auth notes

- The access token lives **only in memory** (`lib/session.ts` + React context). Nothing is written to localStorage/sessionStorage.
- The refresh token is the backend's httpOnly cookie `khilona_rt`; every request uses `credentials: 'include'`.
- On load the app calls `POST /auth/refresh` to restore the session (full-screen loader meanwhile). If the API is unreachable an offline screen with "Try again" is shown.
- A 401 on any request triggers one shared (single-flight) refresh and a single retry. If the refresh fails, the session is cleared, a "Session expired, please sign in again" toast is shown and the user is sent to `/login?next=<current path>`.
- The token is refreshed proactively ~60 s before `expiresIn` elapses.
- 403 responses show a friendly "you don't have permission" message. The Admin users section is only rendered for SUPER_ADMIN.
- `next` redirects are restricted to same-origin relative paths.
- The admin is never indexed: `robots` metadata (`noindex, nofollow`), `app/robots.ts` disallows everything, and `X-Robots-Tag: noindex, nofollow` is sent on every response (`next.config.ts`).

## Business rules

The UI never re-implements backend rules: order status options come from `allowedTransitions` on the order detail; totals, stock and discounts are displayed as returned. The only exception is the quick "change status" menu on the order list, which uses a display copy of the contract transition table to avoid fetching every order — the backend still validates each change (409 on invalid moves).

## Testing

```bash
npm run build && npm run test:e2e
```

- `e2e/auth.spec.ts` — protected route redirects to `/login?next=…`, wrong password error, client-side validation, noindex header + robots.txt.
- `e2e/order-flow.spec.ts` — log in → create a category (timestamped name) → create a product in it with an image upload (`e2e/fixtures/toy.png`) → place an order through the public `POST /api/orders` → find it in Orders → open detail → PENDING → CONFIRMED with a note → verify the timeline entry.

The flow test creates real data (a category, a product and an order) in the connected database each run.

Environment overrides for tests: `E2E_BASE_URL`, `E2E_API_URL`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`. Playwright `@playwright/test@1.63.0` uses the shared browser cache (no browser download needed if Chromium for 1.63 is already installed).
