# WHITE MONKEY TOYS – customer storefront (`khilona_userpanel`)

The customer-facing shop for **White Monkey Toys** (internal project name: Khilona). Premium monochrome design system (black / white / neutral greys, one banana-yellow accent for ratings), Inter Tight + Inter typography, and the black WHITE MONKEY TOYS wordmark with a minimal monkey mark. Built with **Next.js 15.5 (App Router)**, React 19, TypeScript (strict), Tailwind CSS v4, TanStack Query v5, React Hook Form + zod, zustand, lucide-react and sonner.

All store, category and product content comes from the REST API (`docs/API_CONTRACT.md`). Prices, stock and totals are calculated by the backend. The client only displays them.

## Quick start

```bash
cp .env.example .env.local     # adjust if needed
npm install
npm run dev                    # http://localhost:3000
```

The backend must be running at `NEXT_PUBLIC_API_URL` (default `http://localhost:4000/api`, health check: `GET /health`).

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | yes | Public API base URL used by the browser, e.g. `http://localhost:4000/api`. Its origin is also allowed for `next/image`. |
| `NEXT_PUBLIC_SITE_URL` | yes | Public URL of this site. Used for canonical URLs, Open Graph, the sitemap and JSON-LD. |
| `API_URL` | no | Internal API URL for server components (for example, a private network address). Falls back to `NEXT_PUBLIC_API_URL`. |
| `NEXT_PUBLIC_IMAGE_HOSTS` | no | Comma-separated extra image hosts (S3 bucket or CDN), as `cdn.example.com` or `https://cdn.example.com`. |
| `API_PROXY_TARGET` | no | Turns on a same-origin proxy: `/_api/*` is forwarded to this URL. Set `NEXT_PUBLIC_API_URL=<site>/_api` to use it. Use this when the API's CORS allow-list doesn't include the site's origin. |

No URL is hard-coded. `next.config.ts` builds `images.remotePatterns` from these variables. When an image URL's host isn't configured, `SmartImage` renders it unoptimized instead of throwing, and it shows a placeholder when an image fails to load.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Starts the dev server on port 3000 |
| `npm run build` / `npm start` | Creates a production build / serves it on port 3000 |
| `npm run lint` | Runs ESLint (`next/core-web-vitals` + TypeScript rules) with zero warnings allowed |
| `npm run typecheck` | Runs `tsc --noEmit` |
| `npm run test:e2e` | Runs the Playwright e2e suite (desktop + mobile Chromium) |
| `npm run screenshots` | Runs a responsive screenshot sweep (see Testing) |

## Customer accounts

- `/login`, `/signup`, `/forgot-password`, `/reset-password` and `/account/*` (overview, orders, order details with tracking/reviews/documents, profile, reviews, documents).
- The access token lives **in memory only** (`lib/auth/session.ts`); the refresh token is an httpOnly cookie set by the API. A non-sensitive `wmt-signed-in` flag in localStorage only decides whether to attempt a silent refresh on page load.
- `lib/api/authed.ts` attaches the token, refreshes once on 401 and retries; if the refresh fails the session ends with a "session expired" notice.
- Guest checkout and guest tracking keep working without an account; signed-in checkout links the order to the account.
- Review eligibility, order ownership and document access are decided by the API — the UI only renders what it returns.

## Routes

| Route | Rendering | Notes |
|---|---|---|
| `/` | server | Announcement bar, hero (store hero fields with fallbacks), categories, featured, latest, store info, ToyStore + WebSite JSON-LD |
| `/categories` | server | Category tree |
| `/category/[slug]` | server + client filters | Breadcrumb, sub-category chips, search within the category, sort, filters (price, in stock, featured, option facets), server-side pagination. Filter state lives in the URL. |
| `/products` | server + client filters | All products and `?search=` (the header search lands here) |
| `/product/[slug]` | server + client purchase panel | Gallery (thumbnails, scroll-snap swipe, variant image switching), option selectors that resolve to a variant, quantity clamped to stock, add to cart, buy now, WhatsApp enquiry, specs, related products, sticky mobile bar, Product JSON-LD |
| `/cart` | client | Calls `POST /cart/validate` on load and on every change. Shows per-line status, auto-clamps quantities, blocks checkout while there are issues, and asks for confirmation before clearing. |
| `/checkout` | client | 3 steps (Contact → Address & location → Review). zod rules mirror the backend. Optional geolocation. Progress persists in sessionStorage. Handles 422, 409, 403, 429 and network errors, and prevents double submits. |
| `/order/success/[orderNumber]` | client | Uses the order returned by `POST /orders` (stored in sessionStorage). Otherwise it asks for the phone number and calls `/orders/track`. |
| `/track-order` | client | Order number + phone → status timeline |
| `/contact` | server | Contact details, hours with an open/closed badge, call/WhatsApp/directions |
| `/policies/[type]` | server | `shipping`, `returns`, `privacy`, `terms` (from store fields, with an empty state) |
| `not-found`, `error`, `global-error`, `loading` | – | Custom 404, error with retry, route skeletons |

## Structure

```
app/                 routes (App Router), layout, sitemap.ts, robots.ts, providers
components/ui/       primitives: Button, fields, Dialog/Sheet (focus trap), Skeleton, EmptyState, ErrorState, Price, QuantityStepper, SmartImage, Breadcrumbs, JsonLd…
components/layout/   header, categories menu, mobile menu, bottom tab bar, footer, logo
features/cart/       zustand cart store (persisted), validation hook, cart view, summary
features/catalog/    product card/grid, listing (filters, toolbar, pagination), PDP (gallery, variants)
features/checkout/   zod schema, multi-step checkout, geolocation, order snapshot storage
features/orders/     success view, tracking, order details/timeline
features/store/      hero, store info card, hours/open badge, ToyStore JSON-LD helpers
hooks/               focus trap, mounted
lib/                 env, API request/envelope unwrapping, ApiError, server fetch helpers, image helpers
services/            endpoint functions (server: catalog.server.ts; client: cart.ts, orders.ts)
types/api.ts         types copied from docs/API_CONTRACT.md
utils/               formatting (INR), phone (Indian mobile), listing params, Indian states, cn
e2e/                 Playwright specs
```

### Data flow

- **Server components** use `serverGet()` (`fetch` with `next: { revalidate: 60 }`). The root layout calls `connection()`, so every page renders on demand while API data stays cached for 60 s. As a result, `next build` never needs the backend.
- Store and category failures degrade gracefully: the header and footer still render, and sections show an `ErrorState` with a retry button. A `404` from the API becomes `notFound()`. The `[slug]` layouts check existence before the loading boundary, so unknown slugs return a real HTTP 404.
- **Client interactivity** uses TanStack Query: cart validation (`useQuery` keyed by the cart contents), order placement and tracking (`useMutation`).
- **API client**: `lib/api/request.ts` unwraps `{ success, message, data }` and throws `ApiError { status, message, errors[] }` (status `0` means a network failure).
- **Cart**: a zustand store persisted in `localStorage` (`khilona-cart`), keyed by `productId:variantId`. It stores a display snapshot, but totals shown in the cart and at checkout always come from `/cart/validate`. It syncs across tabs through the `storage` event.

## SEO

- `generateMetadata` on every route gives dynamic titles and descriptions, canonical URLs based on `NEXT_PUBLIC_SITE_URL`, and Open Graph and Twitter cards.
- Search pages and filtered category pages are `noindex, follow`. Cart, checkout and order pages are `noindex`.
- JSON-LD: `Product` with `Offer`/`AggregateOffer` (INR, availability), `BreadcrumbList`, `ToyStore` (LocalBusiness) on home and contact, and `WebSite` + `SearchAction` on home.
- `app/sitemap.ts` reads `GET /sitemap` and falls back to static routes if the API is down. `app/robots.ts` disallows cart, checkout and order routes.
- Pagination uses real crawlable links (`?page=n`, `rel=prev/next`).

## Design system

Tokens are defined in `app/globals.css` (`@theme`): ink `#1D1B2F`, muted `#5E5A6E`, page `#FFFCF7`, sand `#F6F1E9`, border `#ECE5DA`, coral `#E4572E`, sunshine `#FFC53D`, teal `#0F8B8D`, success `#1E9E5A`, danger `#D93636`. Headings use Bricolage Grotesque and body text uses Plus Jakarta Sans (both via `next/font`).

White text on `#E4572E` is only about 3.7:1, which fails WCAG AA for normal text. Filled CTAs therefore use the darker coral `#C9461F` (about 4.8:1), with `#A93A19` on hover. The brand coral is kept for accents and large type. Text uses darker shades of success and teal for the same reason.

Accessibility: semantic landmarks, a skip link, real labels on every field, visible focus rings, a focus-trapped Dialog/Sheet that closes on Esc and restores focus, a keyboard-operable categories menu, an `aria-live` cart announcer, and `prefers-reduced-motion` support.

## Testing

```bash
npm run test:e2e
```

- `e2e/checkout.spec.ts` runs against the **real backend**:
  - The full purchase flow: home → category → product (picks options if needed) → cart → checkout (all steps) → place order. It then checks that the order number matches `/^KH-\d{8}-\d{4,}$/`, verifies the order by phone on reload, and checks the track-order timeline.
  - Simple-product add to cart, quantity change, persistence and remove.
  - The variant-selection guard.
  - Client-side validation.
  - 409 and 403 handling (these responses are mocked with `page.route`).
  - Listing filters, sort and search in the URL.
  - JSON-LD and canonical tags, and a real 404 for unknown products.
- The config uses `baseURL` `http://localhost:3000` and reuses an existing server or starts `next dev`. You can override it with `E2E_BASE_URL=http://localhost:3100`.
- Note: the e2e flow **creates real orders** (customer "Playwright Tester", phone 9876543210), and these orders reduce stock.

Responsive screenshots (not part of the e2e run):

```bash
SHOTS_DIR=/tmp/khilona_shots SHOT_WIDTHS=320,360,390,768,1024,1440,1920 SHOT_CHUNKS=1 npm run screenshots
```

This also logs any horizontal overflow (`OVERFLOW …`) for each page and width.

### Running on another port

The backend's CORS allow-list must include the storefront's origin. If you have to run on a port that isn't allowed, use the built-in proxy:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3100/_api API_URL=http://localhost:4000/api \
API_PROXY_TARGET=http://localhost:4000/api NEXT_PUBLIC_IMAGE_HOSTS=http://localhost:4000 \
NEXT_PUBLIC_SITE_URL=http://localhost:3100 npx next dev -p 3100
```
