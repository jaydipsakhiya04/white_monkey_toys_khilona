# Khilona REST API Contract (White Monkey Toys)

> Customer-facing brand: **White Monkey Toys**. "Khilona" is the internal project name.

Base URL: `${NEXT_PUBLIC_API_URL}` → e.g. `http://localhost:4000/api`
Interactive docs (Swagger): `http://localhost:4000/api/docs`

All money values are **numbers in INR** (e.g. `899` or `899.5`). All dates are ISO-8601 strings.

---

## 1. Envelope

Every response uses one envelope.

```ts
type ApiSuccess<T> = { success: true; message: string; data: T };

type ApiErrorBody = {
  success: false;
  statusCode: number;              // mirrors HTTP status
  message: string;                 // human readable summary
  errors: { field?: string; message: string }[]; // field-level details (validation, stock…)
};

type Paginated<T> = {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean };
};
```

HTTP status codes used: `200, 201, 400, 401, 403, 404, 409, 413, 415, 422, 429, 500`.

- `422` → request validation failed (`errors[]` contains `{ field, message }`, `field` is a dot path like `items.0.quantity`).
- `401` → missing/invalid/expired access token (`message: "Session expired"` or `"Unauthorized"`).
- `409` → business conflict (duplicate slug/SKU, insufficient stock, invalid status transition, category in use).
- `429` → rate limited.

Pagination query params: `page` (default 1), `limit` (default 20, max 100; public product listing max 60).

---

## 2. Shared types

```ts
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';
type PaymentMethod = 'CASH_ON_DELIVERY';
type AdminRole = 'SUPER_ADMIN' | 'ADMIN';
type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

type Store = {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  phone: string | null;
  whatsapp: string | null;          // digits incl. country code, e.g. "919876543210"
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  googleMapLink: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  website: string | null;
  openingTime: string | null;       // "10:00" (24h)
  closingTime: string | null;       // "21:00"
  workingDays: string | null;       // "Monday – Saturday"
  isOpen: boolean;                  // manual master switch set by admin
  closedMessage: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroCtaLabel: string | null;
  announcement: string | null;
  shippingPolicy: string | null;
  returnPolicy: string | null;
  privacyPolicy: string | null;
  termsAndConditions: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  currency: string;                 // "INR"
  createdAt: string;
  updatedAt: string;
};

// Public store adds computed fields
type PublicStore = Store & {
  isOpenNow: boolean;               // isOpen && current time (store timezone) within opening hours
  whatsappUrl: string | null;       // "https://wa.me/919876543210"
  phoneUrl: string | null;          // "tel:+919876543210"
};

type CategoryRef = { id: string; name: string; slug: string };

type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  productCount: number;             // active products in this category + its children
  children: CategorySummary[];      // only for top-level items in tree responses, else []
};

type CategoryDetail = CategorySummary & {
  seoTitle: string | null;
  seoDescription: string | null;
  parent: CategoryRef | null;
  children: CategorySummary[];
  updatedAt: string;
};

type ProductCard = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  price: number;                    // regular price (MRP)
  salePrice: number | null;         // discounted price, null if no discount
  effectivePrice: number;           // salePrice ?? price
  discountPercent: number;          // 0..100 rounded
  minPrice: number;                 // lowest effective price across active variants (== effectivePrice if no variants)
  maxPrice: number;
  stock: number;
  inStock: boolean;
  stockStatus: StockStatus;
  isFeatured: boolean;
  hasVariants: boolean;             // true => customer must pick options on product page
  category: CategoryRef;
  rating: { average: number; count: number }; // APPROVED verified-purchase reviews (average 0 when none)
  createdAt: string;
};

type ProductImage = { id: string; url: string; alt: string | null; position: number };

type ProductOptionGroup = {
  id: string;
  name: string;                     // "Color"
  position: number;
  values: { id: string; value: string; position: number }[];
};

type ProductVariant = {
  id: string;
  title: string;                    // "Red / Large"
  sku: string | null;
  price: number;                    // resolved (variant override or product price)
  salePrice: number | null;         // resolved
  effectivePrice: number;
  discountPercent: number;
  stock: number;
  inStock: boolean;
  imageUrl: string | null;
  optionValueIds: string[];         // ids from ProductOptionGroup.values
  options: Record<string, string>;  // { Color: "Red", Size: "Large" }
};

type ProductDetail = ProductCard & {
  description: string | null;
  sku: string | null;
  specifications: { label: string; value: string }[];
  images: ProductImage[];           // ordered by position
  options: ProductOptionGroup[];    // [] if no variants
  variants: ProductVariant[];       // only active variants; [] if no variants
  category: CategoryRef & { parent: CategoryRef | null };
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
};

type AdminProfile = {
  id: string; name: string; email: string; phone: string | null;
  role: AdminRole; isActive: boolean; lastLoginAt: string | null; createdAt: string;
};
```

---

## 3. Public endpoints (no auth)

### `GET /health`
`{ status: 'ok', database: 'up' | 'down', uptime: number, timestamp: string }`

### `GET /store` → `PublicStore`

### `GET /categories` → `CategorySummary[]`
Active categories as a tree (top-level items with `children`). Sorted by `sortOrder`, then name.
Query: `flat=true` → flat list of all active categories (children `[]`).

### `GET /categories/:slug` → `CategoryDetail`
404 if not found or inactive.

### `GET /products` → `Paginated<ProductCard>`
Query params (all optional):

| param | example | notes |
|---|---|---|
| `category` | `toys` | category slug; includes products of its child categories |
| `search` | `car` | matches name, SKU, short/long description, category name (case-insensitive) |
| `minPrice` / `maxPrice` | `100` / `1000` | on effective price |
| `inStock` | `true` | only stock > 0 |
| `featured` | `true` | only featured |
| `options` | `Color:Red,Color:Blue,Age:3+` | same name = OR, different names = AND |
| `sort` | `featured` (default) \| `popular` \| `newest` \| `price_asc` \| `price_desc` \| `name_asc` \| `name_desc` | `popular` = most reviewed / best rated |
| `page`, `limit` | `1`, `20` | limit max 60 |

### `GET /products/facets` → `ProductFacets`
Query: `category` (slug, optional), `search` (optional).
```ts
type ProductFacets = {
  priceRange: { min: number; max: number };
  options: { name: string; values: string[] }[];   // option names/values present on matching products
  categories: (CategoryRef & { count: number })[]; // categories that have matching products
  total: number;
};
```

### `GET /products/:slug` → `ProductDetail`
404 if missing, inactive, deleted, or its category inactive.

### `GET /products/:slug/related?limit=8` → `ProductCard[]`

### `GET /sitemap` → `{ products: { slug: string; updatedAt: string }[]; categories: { slug: string; updatedAt: string }[] }`

### `POST /cart/validate`
Re-prices and validates a client cart against live data. Use on cart page load and before checkout.
```ts
// request
{ items: { productId: string; variantId?: string | null; quantity: number }[] }   // 1..50 items

// response
type CartValidation = {
  items: CartLine[];
  // only OK/QUANTITY_ADJUSTED lines counted. itemsCount = total quantity.
  // subtotal = Σ unitMrp × qty, discount = Σ (unitMrp − unitPrice) × qty, total = subtotal − discount + shippingFee
  summary: { itemsCount: number; subtotal: number; discount: number; shippingFee: number; total: number };
  hasIssues: boolean;
};
type CartLine = {
  productId: string;
  variantId: string | null;
  requestedQuantity: number;
  quantity: number;                 // quantity that can actually be bought (clamped to stock)
  maxQuantity: number;              // available stock (capped at 99)
  status: 'OK' | 'QUANTITY_ADJUSTED' | 'OUT_OF_STOCK' | 'UNAVAILABLE' | 'VARIANT_REQUIRED';
  message: string | null;           // e.g. "Only 2 left in stock", "This product is no longer available"
  product: { id: string; name: string; slug: string; thumbnailUrl: string | null; sku: string | null } | null; // null if deleted
  variant: { id: string; title: string; options: Record<string, string>; imageUrl: string | null } | null;
  unitMrp: number;
  unitPrice: number;
  lineTotal: number;                // unitPrice * quantity
};
```

### `POST /orders` → `201 PublicOrder & { linkedToAccount: boolean }`
Rate limited (10/min/IP). Guest checkout needs no token. With an optional customer `Authorization: Bearer <token>` the order is linked to that account (shows under "My orders"); an invalid/expired token returns `401` so the client can refresh. Prices and stock are always re-validated server-side.
```ts
// request
{
  customerName: string;             // 2..80
  phone: string;                    // Indian mobile; "+91 98765 43210", "09876543210", "9876543210" all accepted → normalised to 10 digits
  alternatePhone?: string;
  email?: string;
  address: string;                  // 5..500 — house/flat, street, area
  city: string;                     // 2..60
  state: string;                    // 2..60
  pincode: string;                  // 6 digits
  landmark?: string;
  googleMapsLink?: string;          // http(s) URL
  locationLink?: string;            // any other http(s) location link
  latitude?: number;                // from browser geolocation (optional)
  longitude?: number;
  note?: string;                    // <= 1000
  items: { productId: string; variantId?: string | null; quantity: number }[]; // 1..50, quantity 1..99
}
```
Errors: `422` validation; `409` when any item is unavailable / out of stock / quantity exceeds stock — `errors[]` has `{ field: "items.<index>", message }`; `403` with message when store is closed (`isOpen=false`) — ordering is still allowed if `isOpen` is true even outside hours.

```ts
type PublicOrder = {
  orderNumber: string;              // "WMT-20261002-0001"
  status: OrderStatus;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  alternatePhone: string | null;
  customerEmail: string | null;
  address: string; city: string; state: string; pincode: string; landmark: string | null;
  googleMapsLink: string | null;
  locationLink: string | null;
  customerNote: string | null;
  items: {
    productName: string; productSlug: string | null; variantTitle: string | null;
    options: { name: string; value: string }[]; imageUrl: string | null; sku: string | null;
    quantity: number; unitMrp: number; unitPrice: number; lineTotal: number;
  }[];
  itemsCount: number;
  subtotal: number; discount: number; shippingFee: number; total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  history: { status: OrderStatus; createdAt: string }[];
};
```

### `GET /orders/track?orderNumber=WMT-20261002-0001&phone=9876543210` → `PublicOrder`
404 unless both order number and phone match. Rate limited (`THROTTLE_TRACK_LIMIT`, 20/min/IP).

### `POST /orders/track/invoice` · `POST /orders/track/receipt` → `application/pdf`
Body `{ orderNumber, phone }` (same proof as tracking; POST keeps the phone out of URLs/logs). 404 unless both match. Invoice is `409` for cancelled orders.

### `GET /products/:slug/reviews?page&limit&rating` → `Paginated<PublicReview> & { summary }`
```ts
type PublicReview = {
  id: string; rating: 1|2|3|4|5; comment: string | null;
  authorName: string;               // privacy-safe: "Jaydip P."
  variantTitle: string | null;      // what the reviewer bought
  verifiedPurchase: true;           // every review comes from a delivered order of the reviewer
  createdAt: string; updatedAt: string;
};
type ReviewSummary = { average: number; count: number; distribution: { "1": number; "2": number; "3": number; "4": number; "5": number } };
```
Only `APPROVED` reviews are returned.

---

## 4. Authentication (admin)

Access token: short-lived JWT returned in body; send as `Authorization: Bearer <token>`.
Refresh token: rotating, **httpOnly cookie** `khilona_rt` (path `/api/auth`). Frontend must call auth endpoints with `credentials: 'include'`.

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | `{ accessToken, expiresIn, admin: AdminProfile }` + sets cookie. 401 invalid credentials. Rate limited 5/min. |
| POST | `/auth/refresh` | – (cookie) | same as login (rotates cookie). 401 if missing/expired/revoked. |
| POST | `/auth/logout` | – (cookie) | `null`; revokes refresh token, clears cookie |
| GET | `/auth/me` | – | `AdminProfile` |
| PATCH | `/auth/me` | `{ name?, phone? }` | `AdminProfile` |
| PATCH | `/auth/me/password` | `{ currentPassword, newPassword }` (min 8, letter + number) | `null`; revokes all refresh tokens except current |

`expiresIn` is in seconds (default 900). Recommended client strategy: keep access token in memory; on app load and on any 401 call `/auth/refresh` once, then retry; if refresh fails → redirect to login.

---

## 4b. Customer accounts (storefront)

Separate from admin auth: customer access tokens use the JWT audience `khilona-customer` and are rejected on admin routes (and vice versa).
Refresh token: rotating **httpOnly cookie** `wmt_crt` (path `/api/auth/customer`, default 30 days). Call auth endpoints with `credentials: 'include'`; keep the access token in memory only.

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/auth/customer/signup` | `{ name, email, phone, password }` | `201 { accessToken, expiresIn, customer: CustomerProfile }` + cookie. `409` with `errors[]` for duplicate `email` / `phone`. |
| POST | `/auth/customer/login` | `{ identifier, password }` (email or mobile) | as signup. `401 "Email/mobile or password is incorrect"`. |
| POST | `/auth/customer/refresh` | – (cookie) | rotates cookie; reuse of a revoked token revokes all sessions |
| POST | `/auth/customer/logout` | – (cookie) | `null` |
| POST | `/auth/customer/forgot-password` | `{ identifier }` | always `200 { deliveryAvailable: boolean }` — never reveals whether an account exists; `false` when no email/SMS channel is configured |
| POST | `/auth/customer/reset-password` | `{ token, password }` | `null`; single-use token (30 min), signs out all sessions. `400` invalid/expired |
| PATCH | `/auth/customer/password` | `{ currentPassword, newPassword }` | `null`; signs out other sessions |

Login/signup/forgot/reset are rate limited (`THROTTLE_LOGIN_LIMIT`). Password rule: 8–72 chars, at least one letter and one number.

```ts
type CustomerProfile = { id: string; name: string; email: string | null; phone: string; registeredAt: string | null; createdAt: string };
```

### Customer endpoints (customer Bearer token required)

Every order route is scoped to the caller's account: another customer's order number returns **404**.
An order belongs to an account when it was placed while signed in, or was claimed (order number + the account's mobile).

| Method | Path | Notes |
|---|---|---|
| GET / PATCH | `/customer/profile` | PATCH `{ name?, email?, phone? }`; `409` if email/mobile belongs to another account |
| GET | `/customer/orders/summary` | `{ totalOrders, activeOrders, deliveredOrders, cancelledOrders, recentOrders[] }` |
| GET | `/customer/orders?status=active\|delivered\|cancelled&page&limit` | newest first |
| POST | `/customer/orders/claim` | `{ orderNumber }` — adds an earlier guest order placed with the account's mobile; `404` otherwise |
| GET | `/customer/orders/:orderNumber` | `CustomerOrder` (below) |
| POST | `/customer/orders/:orderNumber/cancel` | `{ reason? }`; only while `PENDING` (`409` after the store confirms); stock restored |
| GET | `/customer/orders/:orderNumber/invoice` | `application/pdf`, `Content-Disposition: attachment; filename="white-monkey-toys-invoice-<orderNumber>.pdf"`; `409` for cancelled orders |
| GET | `/customer/orders/:orderNumber/receipt` | `application/pdf` |
| GET | `/customer/reviews` | your reviews (paginated) |
| POST | `/customer/reviews` | `{ orderNumber, productId, rating: 1..5, comment? (≤2000) }` → `201`. `403` order not delivered / product not in the order; `404` not your order; `409` already reviewed (customer + product + order) |
| PATCH / DELETE | `/customer/reviews/:id` | own reviews only |

```ts
type CustomerOrder = PublicOrder & {
  deliveredAt: string | null; cancelledAt: string | null;
  items: (PublicOrder['items'][number] & {
    productId: string | null;
    review: { id: string; rating: number; comment: string | null; status: 'PENDING'|'APPROVED'|'HIDDEN'; createdAt: string; updatedAt: string } | null;
    canReview: boolean;             // decided by the API (delivered + owned + not yet reviewed)
  })[];
  canCancel: boolean;               // status === PENDING
  documents: { invoice: boolean; receipt: boolean };
};
```

Documents are rendered from the order's own snapshot (names, SKUs, options, unit prices, totals, address), never from the live catalogue. Invoice number = order number with the prefix replaced by `INV-`.

---

## 5. Admin endpoints (Bearer token required)

All under `/admin`. `403` if role is insufficient.

### Dashboard — `GET /admin/dashboard`
```ts
type Dashboard = {
  orders: {
    total: number;
    today: number;
    byStatus: Record<OrderStatus, number>;
    deliveredRevenue: number;       // sum of totals of DELIVERED orders
    openValue: number;              // sum of totals of orders not DELIVERED/CANCELLED
  };
  products: { total: number; active: number; inactive: number; outOfStock: number; lowStock: number; featured: number };
  categories: { total: number; active: number };
  recentOrders: AdminOrderListItem[];   // latest 6
  lowStockProducts: { id: string; name: string; sku: string | null; stock: number; thumbnailUrl: string | null; lowStockThreshold: number }[]; // up to 6
  ordersLast14Days: { date: string; count: number; total: number }[]; // date "2026-10-02", oldest → newest, zero-filled
};
```

### Store
- `GET /admin/store` → `Store`
- `PUT /admin/store` → `Store`. Body: any subset of editable `Store` fields (`name` required non-empty if present). Times `HH:mm`. Empty string → `null`.

### Uploads
- `POST /admin/uploads/image?folder=products|categories|store` — `multipart/form-data`, field `file`.
  Accepts jpeg/png/webp/avif/gif up to 5 MB. Image is resized (max 1600px) and converted to WebP.
  → `201 { url: string; width: number; height: number; size: number; contentType: 'image/webp' }`
  Errors: `413` too large, `415` unsupported type.

### Categories
```ts
type AdminCategory = {
  id: string; name: string; slug: string; description: string | null; imageUrl: string | null;
  isActive: boolean; sortOrder: number; parentId: string | null; parent: { id: string; name: string } | null;
  productCount: number;        // live products incl. sub-categories
  directProductCount: number;  // live products assigned directly to this category
  childrenCount: number; seoTitle: string | null; seoDescription: string | null;
  createdAt: string; updatedAt: string;
};
type CategoryInput = {
  name: string; slug?: string; description?: string | null; imageUrl?: string | null;
  isActive?: boolean; sortOrder?: number; parentId?: string | null; seoTitle?: string | null; seoDescription?: string | null;
};
```
| Method | Path | Notes |
|---|---|---|
| GET | `/admin/categories` | `search, status=active\|inactive, parentId (id or "root"), sort=sortOrder\|name\|newest\|products, page, limit` → `Paginated<AdminCategory>` |
| GET | `/admin/categories/options` | `{ id, name, parentId, isActive }[]` all categories (for selects) |
| GET | `/admin/categories/:id` | `AdminCategory` |
| POST | `/admin/categories` | `CategoryInput` → 201. Slug auto-generated from name if omitted; made unique. 409 if explicit slug taken. |
| PUT | `/admin/categories/:id` | partial `CategoryInput`. 409 if parent would create a cycle / nest deeper than 2 levels. |
| PATCH | `/admin/categories/reorder` | `{ items: { id, sortOrder }[] }` → `null` |
| DELETE | `/admin/categories/:id?moveProductsTo=<categoryId>` | 409 if it has sub-categories, or has products and `moveProductsTo` not given. With `moveProductsTo`, products are moved first. → `{ movedProducts: number }` |

### Products
```ts
type AdminProductListItem = {
  id: string; name: string; slug: string; sku: string | null; thumbnailUrl: string | null;
  price: number; salePrice: number | null; stock: number; stockStatus: StockStatus; lowStockThreshold: number;
  isActive: boolean; isFeatured: boolean; hasVariants: boolean; variantsCount: number; sortOrder: number;
  category: { id: string; name: string }; createdAt: string; updatedAt: string;
};
type AdminProductDetail = AdminProductListItem & {
  shortDescription: string | null; description: string | null;
  specifications: { label: string; value: string }[];
  seoTitle: string | null; seoDescription: string | null;
  images: ProductImage[];
  options: { name: string; values: string[] }[];
  variants: {
    id: string; title: string; options: Record<string, string>; sku: string | null;
    price: number | null; salePrice: number | null;   // raw overrides (null = inherit product price)
    stock: number; imageUrl: string | null; isActive: boolean; position: number;
  }[];
  ordersCount: number;
};
type ProductInput = {
  name: string;                     // required on create
  slug?: string;
  categoryId: string;               // required on create
  shortDescription?: string | null;
  description?: string | null;
  sku?: string | null;
  price: number;                    // required on create, > 0
  salePrice?: number | null;        // must be < price
  stock?: number;                   // ignored when variants are provided (computed as sum)
  lowStockThreshold?: number;
  isFeatured?: boolean; isActive?: boolean; sortOrder?: number;
  seoTitle?: string | null; seoDescription?: string | null;
  specifications?: { label: string; value: string }[];
  images?: { url: string; alt?: string | null }[];     // full ordered list; replaces existing; first = thumbnail
  options?: { name: string; values: string[] }[];      // full list; [] removes variants
  variants?: {                                         // required when options non-empty: one per combination to sell
    options: Record<string, string>;                   // must reference option names/values above
    sku?: string | null; price?: number | null; salePrice?: number | null;
    stock: number; imageUrl?: string | null; isActive?: boolean;
  }[];
};
```
| Method | Path | Notes |
|---|---|---|
| GET | `/admin/products` | `search, categoryId, status=active\|inactive, stock=in\|low\|out, featured=true\|false, sort=newest\|oldest\|name_asc\|name_desc\|price_asc\|price_desc\|stock_asc\|sortOrder, page, limit` → `Paginated<AdminProductListItem>` (soft-deleted excluded) |
| GET | `/admin/products/:id` | `AdminProductDetail` |
| POST | `/admin/products` | `ProductInput` → 201 `AdminProductDetail`. 409 duplicate SKU/slug. |
| PUT | `/admin/products/:id` | partial `ProductInput` → `AdminProductDetail`. Variants are matched by option combination so existing variant IDs are kept. |
| PATCH | `/admin/products/:id/status` | `{ isActive?, isFeatured? }` → `AdminProductListItem` |
| PATCH | `/admin/products/bulk` | `{ ids: string[], action: 'activate'\|'deactivate'\|'feature'\|'unfeature'\|'delete' }` → `{ affected: number }` |
| DELETE | `/admin/products/:id` | → `{ mode: 'deleted' \| 'archived' }` (archived = soft delete because orders reference it) |

### Orders
```ts
type AdminOrderListItem = {
  id: string; orderNumber: string; status: OrderStatus; paymentStatus: PaymentStatus;
  customerName: string; customerPhone: string; city: string;
  itemsCount: number; total: number; itemsPreview: string[]; // first 3 product names
  createdAt: string; updatedAt: string;
};
type AdminOrderDetail = PublicOrder & {
  id: string;
  customerId: string | null;
  latitude: number | null; longitude: number | null;
  adminNote: string | null;
  confirmedAt: string | null; deliveredAt: string | null; cancelledAt: string | null;
  stockRestored: boolean;
  updatedAt: string;
  items: (PublicOrder['items'][number] & { id: string; productId: string | null; variantId: string | null; categoryName: string | null })[];
  history: { id: string; fromStatus: OrderStatus | null; toStatus: OrderStatus; note: string | null; changedByName: string | null; createdAt: string }[];
  allowedTransitions: OrderStatus[];
  contact: { callUrl: string; whatsappUrl: string; alternateCallUrl: string | null; mapsUrl: string | null };
  customerOrdersCount: number;      // total orders placed with this phone
};
```
| Method | Path | Notes |
|---|---|---|
| GET | `/admin/orders` | `status, search (order no / name / phone), from, to (YYYY-MM-DD, store timezone, inclusive), sort=newest\|oldest\|total_desc\|total_asc, page, limit` → `Paginated<AdminOrderListItem>` |
| GET | `/admin/orders/status-counts` | `Record<OrderStatus \| 'ALL', number>` |
| GET | `/admin/orders/:id` | `AdminOrderDetail` (`:id` may be the id or the order number) |
| PATCH | `/admin/orders/:id/status` | `{ status: OrderStatus, note?: string }` → `AdminOrderDetail`. 409 on invalid transition. |
| PATCH | `/admin/orders/:id` | `{ adminNote?: string \| null, paymentStatus?: PaymentStatus }` → `AdminOrderDetail` |

Status transitions:
```
PENDING          → CONFIRMED, CANCELLED
CONFIRMED        → PROCESSING, READY, OUT_FOR_DELIVERY, CANCELLED
PROCESSING       → READY, OUT_FOR_DELIVERY, CANCELLED
READY            → OUT_FOR_DELIVERY, DELIVERED, CANCELLED
OUT_FOR_DELIVERY → DELIVERED, CANCELLED
DELIVERED, CANCELLED → (final)
```
Stock policy: stock is **decremented when the order is placed**; it is **restored once when an order is CANCELLED**.

### Admin users (SUPER_ADMIN only)
| Method | Path | Body |
|---|---|---|
| GET | `/admin/admins` | → `AdminProfile[]` |
| POST | `/admin/admins` | `{ name, email, password, phone?, role }` → 201 `AdminProfile` |
| PATCH | `/admin/admins/:id` | `{ name?, phone?, role?, isActive?, password? }` → `AdminProfile` (cannot deactivate/demote yourself) |

### Reviews (moderation)
| Method | Path | Notes |
|---|---|---|
| GET | `/admin/reviews?status=PENDING\|APPROVED\|HIDDEN&rating&search&page&limit` | `Paginated<AdminReview> & { statusCounts: { ALL, PENDING, APPROVED, HIDDEN } }` |
| PATCH | `/admin/reviews/:id/status` | `{ status: 'APPROVED' \| 'HIDDEN' }` — admins can publish or hide, **never edit** a rating or text |

Store setting `reviewsRequireApproval` (in `PUT /admin/store`): when true, new and edited reviews start as `PENDING`.
Admin order details additionally return `linkedToAccount` and `customerHasAccount`.
