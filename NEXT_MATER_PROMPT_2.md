# MASTER DEVELOPMENT PROMPT
# WHITE MONKEY TOYS
## Premium Toy Storefront + Customer Accounts + Orders + Reviews + Invoices

---

## ROLE

You are a **senior full-stack engineer, product designer, UX architect, UI engineer, database architect, security engineer, and e-commerce specialist**.

You are working on an already-built and functional product called **Khilona**.

The existing product consists of:

```text
khilona/
│
├── khilona_backend/
├── khilona_userpanel/
├── khilona_adminpanel/
├── docs/
├── docker-compose.yml
└── README.md
```

The architecture is:

```text
                         PostgreSQL
                             ▲
                             │
                          Prisma
                             │
                     khilona_backend
                    NestJS REST API
                         Port 4000
                        /api
                          │
             ┌────────────┴────────────┐
             │                         │
             ▼                         ▼
     khilona_userpanel         khilona_adminpanel
        Next.js 15                 Next.js 15
        Port 3000                  Port 3001
        Storefront                 Back Office
```

The existing application is **already working**.

### CRITICAL RULE

**DO NOT rebuild the application from scratch.**

**DO NOT unnecessarily replace the existing architecture.**

**DO NOT remove working functionality.**

**DO NOT break existing APIs, business rules, database relationships, admin functionality, stock management, or guest checkout.**

Your job is to **inspect the existing implementation and upgrade it into a premium production-ready platform**.

The final customer-facing brand is:

# WHITE MONKEY TOYS

The internal repository/project name may remain:

# KHILONA

---

# 1. FIRST: AUDIT THE ENTIRE EXISTING PROJECT

Before writing or changing code, inspect the entire project.

Read and understand:

```text
README.md

khilona_backend/
khilona_userpanel/
khilona_adminpanel/

docs/API_CONTRACT.md
```

Also inspect:

- Prisma schema
- migrations
- seed files
- authentication modules
- customer modules
- order modules
- product modules
- category modules
- store settings
- admin authentication
- API services
- frontend layouts
- components
- hooks
- utilities
- forms
- validation
- responsive styles
- existing tests
- existing design system

Understand the current implementation before making changes.

The existing project already contains:

- NestJS 11
- PostgreSQL 16
- Prisma 6
- JWT authentication
- refresh-token architecture
- bcrypt
- customer model
- order model
- product management
- category management
- stock management
- admin authentication
- order status lifecycle
- guest checkout
- order snapshots
- server-side pricing validation
- separate customer and admin applications

Preserve these foundations.

---

# 2. CURRENT BUSINESS MODEL

This is a toy-store platform.

Customers can:

- browse products
- browse categories
- view products
- add products to cart
- place orders
- pay on delivery
- track orders

The existing application intentionally does NOT require an online payment gateway.

Keep:

# PAY ON DELIVERY

as the current ordering model.

Do not introduce Razorpay, Stripe, PayPal, etc. unless explicitly requested later.

---

# 3. BRAND TRANSFORMATION

The customer-facing brand must now be:

# WHITE MONKEY TOYS

Do not display "Khilona" as the customer-facing store brand.

"Khilona" can remain in:

- repository names
- internal code
- internal documentation
- development environment

but customer-facing content should use:

# WHITE MONKEY TOYS

---

# 4. BRAND PERSONALITY

White Monkey Toys should feel:

- Premium
- Modern
- Minimal
- Playful
- Friendly
- Trustworthy
- Family-oriented
- High-quality
- Contemporary

It should NOT look like:

- a cheap toy website
- a generic Bootstrap template
- an overly colorful children's website
- an AI-generated template
- a basic CRUD project

The primary audience is:

- parents
- families
- gift buyers
- people purchasing toys for children

---

# 5. LOGO

Create/improve the White Monkey Toys logo treatment.

Preferred style:

# WHITE MONKEY TOYS

Use a:

- black wordmark
- modern premium typeface
- clean typography
- minimal design
- strong visual balance

The logo should work in:

- navbar
- mobile header
- footer
- login
- signup
- account pages
- checkout
- order tracking
- invoices
- receipts
- favicon/brand assets

Avoid:

- excessive gradients
- complex mascot illustrations
- childish cartoon graphics
- excessive colors
- complicated symbols

If an icon is used, keep it minimal and premium.

---

# 6. PREMIUM DESIGN SYSTEM

Create a consistent design system across the storefront.

### Primary colors

```text
Black: #000000
White: #FFFFFF
```

Use neutral shades for:

- backgrounds
- cards
- borders
- muted text
- secondary text

You may introduce **one subtle accent color** if genuinely useful.

Do NOT create a rainbow toy-store UI.

---

# 7. TYPOGRAPHY

Use a modern premium sans-serif font.

Create a clear hierarchy:

```text
Hero Heading
Section Heading
Product Name
Price
Body Text
Metadata
Button Text
```

Use typography to create the premium feeling rather than excessive visual effects.

---

# 8. PREMIUM UX PRINCIPLE

Premium does NOT mean:

- huge shadows
- excessive gradients
- glassmorphism everywhere
- giant rounded cards
- excessive animations
- too many colors
- decorative clutter

Premium means:

- excellent spacing
- strong typography
- clean product imagery
- consistent components
- restrained colors
- clear hierarchy
- smooth interactions
- excellent responsive behavior

Think:

**modern premium e-commerce + Apple-level cleanliness + subtle playful toy-store personality.**

---

# 9. CUSTOMER AUTHENTICATION

The existing system supports guest ordering.

KEEP guest ordering.

But now introduce full customer accounts.

Users should be able to:

- Sign up
- Log in
- Log out
- View profile
- View orders
- Track orders
- Download invoices
- Download receipts
- Review purchased products

---

# 10. CUSTOMER SIGNUP

Create a premium signup page.

Fields:

```text
Full Name
Email
Mobile Number
Password
Confirm Password
```

Validation:

- required fields
- valid email
- valid phone
- password strength
- password confirmation
- duplicate email
- duplicate mobile

Use excellent inline validation.

Do not expose raw backend errors.

---

# 11. CUSTOMER LOGIN

Create a premium login page.

Support:

- Email/mobile
- Password
- Show/hide password
- Forgot password
- Logout
- Session handling

Use the existing secure authentication architecture.

### SECURITY

Never store sensitive JWT tokens in localStorage.

Continue using secure:

- access token
- refresh token
- httpOnly cookies
- server-side validation
- authorization

where appropriate.

---

# 12. FORGOT PASSWORD

Add a proper password recovery flow if backend infrastructure allows it.

Flow:

```text
Forgot Password
       ↓
Enter Email / Mobile
       ↓
Verification
       ↓
Create New Password
       ↓
Password Updated
       ↓
Login
```

If an email/SMS provider is not currently configured, build the architecture cleanly without pretending the external delivery system exists.

---

# 13. CUSTOMER ACCOUNT

Create:

# My Account

Suggested sections:

```text
Overview
My Orders
Track Order
Profile
Reviews
Documents
Logout
```

---

# 14. ACCOUNT OVERVIEW

Show:

```text
Hello, [Customer Name]

Total Orders
Active Orders
Delivered Orders
```

Then:

# Recent Orders

Show recent orders with:

- Order number
- Date
- Total
- Status
- View Order

---

# 15. NAVBAR ACCOUNT EXPERIENCE

When logged out:

```text
Login
Sign Up
```

When logged in:

```text
Hi, Jaydip
```

Dropdown:

```text
My Account
My Orders
Track Order
Profile
Logout
```

Mobile navigation should provide the same functionality cleanly.

---

# 16. HOMEPAGE REDESIGN

Upgrade the existing homepage without unnecessarily replacing its functionality.

Structure:

```text
Header
↓
Hero
↓
Categories
↓
Featured Products
↓
Popular / Recommended Products
↓
Why White Monkey Toys
↓
Trust / Ordering Information
↓
CTA
↓
Footer
```

---

# 17. HERO SECTION

Create a premium hero.

Example messaging:

# Find Something They’ll Love

Supporting copy should communicate:

- quality toys
- easy ordering
- trusted store
- convenient delivery

Buttons:

```text
Shop Toys
Explore Categories
```

Use beautiful realistic toy imagery.

Do not overcrowd the hero.

---

# 18. CATEGORY EXPERIENCE

Display categories dynamically from the backend.

Examples:

- Baby Toys
- Educational Toys
- Remote Control
- Dolls
- Games
- Outdoor Toys
- Soft Toys
- Building Toys

Do not hard-code categories if the existing API already provides them.

Create visually premium category cards.

---

# 19. PRODUCT CATALOGUE

Improve product browsing.

Product cards should show:

- product image
- product name
- category
- price
- MRP
- discount
- stock status
- variant information where applicable
- Add to Cart

Keep cards clean.

---

# 20. SEARCH

Improve search UX.

Support:

- search products
- category matching
- suggestions where practical
- no-results state
- recommended products

Search should be:

- fast
- obvious
- mobile-friendly

---

# 21. FILTERING & SORTING

Preserve existing filtering.

Where supported, include:

```text
Category
Subcategory
Price
Availability
```

Sorting:

```text
Featured
Price: Low → High
Price: High → Low
Newest
```

Only implement backend-supported functionality or extend the backend properly.

---

# 22. PRODUCT DETAILS PAGE

Create a premium product page.

Desktop:

```text
Product Gallery       Product Details
----------------      ----------------
Images                Product Name
                      Price
                      MRP
                      Discount
                      Stock
                      Variants
                      Quantity
                      Add to Cart
```

Include:

- image gallery
- zoom
- variants
- stock
- description
- specifications
- related products
- customer reviews

---

# 23. CART

Improve the cart.

Show:

- product image
- name
- variants
- quantity
- price
- remove
- subtotal
- shipping
- total

Desktop:

```text
Products              Order Summary
----------------      ----------------
Product               Subtotal
Product               Shipping
                      Discount
                      Total
                      Checkout
```

Mobile must be optimized for touch.

---

# 24. CHECKOUT

Create a simple premium checkout.

Suggested steps:

```text
Customer Information
        ↓
Delivery Address
        ↓
Order Review
        ↓
Place Order
```

Because the store currently uses manual/POD ordering:

# Pay on Delivery

must remain clearly visible.

Do not add online payments.

---

# 25. GUEST CHECKOUT

Guest checkout must remain functional.

Do NOT force account creation.

A guest should still be able to:

- browse
- cart
- checkout
- place order
- track order

After order completion, you may gently encourage:

> Create an account to easily track all your future orders.

Do not block the order.

---

# 26. GUEST ORDER TRACKING

Create:

# Track Your Order

Guest tracking can use:

```text
Order Number
+
Mobile Number
```

Then show order status.

Security is mandatory.

Never reveal an order unless the provided identifying information matches.

---

# 27. CUSTOMER ORDER HISTORY

Logged-in customers should see:

# My Orders

Each order:

```text
Order #WMT-YYYYMMDD-XXXX
Date
Products
Total
Status
View Details
```

Sort newest first.

Provide useful empty states.

---

# 28. ORDER TRACKING

Existing order lifecycle:

```text
PENDING
↓
CONFIRMED
↓
PROCESSING
↓
READY
↓
OUT_FOR_DELIVERY
↓
DELIVERED
```

Cancellation:

```text
CANCELLED
```

Create a premium visual timeline.

Example:

```text
✓ Order Placed
      |
✓ Confirmed
      |
✓ Processing
      |
● Ready
      |
○ Out for Delivery
      |
○ Delivered
```

Show:

- status
- date
- time
- notes where appropriate

On mobile, timeline must remain easy to understand.

---

# 29. ORDER DETAILS

Order details should contain:

### Order Summary

- Order number
- Date
- Status

### Products

- image
- name
- SKU
- variant
- quantity
- price
- total

### Pricing

- subtotal
- discount
- shipping
- grand total

### Delivery

- name
- phone
- email
- address
- city
- state
- pincode
- landmark

### Tracking

Visual status timeline.

---

# 30. ORDER ACTIONS

Depending on order status:

```text
Continue Shopping
Contact Store
Cancel Order
Download Invoice
Download Receipt
```

Only show cancellation where existing business rules allow it.

---

# 31. CUSTOMER PRODUCT REVIEWS

Now that customers have accounts, introduce a product review system.

Customers can review products they have actually received.

A review is allowed only if:

```text
Customer is authenticated
        ↓
Customer owns order
        ↓
Order contains product
        ↓
Order status = DELIVERED
        ↓
Customer has not already reviewed it
        ↓
Review allowed
```

The frontend must NOT determine eligibility.

The backend must enforce it.

---

# 32. REVIEW FORM

Inside:

```text
My Orders
→ Order Details
→ Delivered Product
```

Show:

```text
How was this product?

★★★★★

Write your review
[________________________]

[Submit Review]
```

Rating:

```text
1–5 stars
```

Written review is optional/required according to the final UX decision.

---

# 33. VERIFIED PURCHASE

Reviews from eligible delivered orders should display:

# ✓ Verified Purchase

Do not allow users to falsely claim verified purchases.

---

# 34. PRODUCT REVIEW SECTION

On product pages:

```text
Customer Reviews

★★★★★ 4.8
Based on 24 reviews
```

Show:

- rating
- review text
- customer safe display name
- date
- verified purchase badge

Add rating distribution if useful.

---

# 35. REVIEW DUPLICATION

Prevent duplicate reviews for the same:

```text
Customer
+
Product
+
Order
```

If already reviewed:

```text
✓ You reviewed this product
```

Allow editing if appropriate.

---

# 36. ADMIN REVIEW MANAGEMENT

If compatible with the existing architecture, add review management to admin.

Admin can:

- view reviews
- see product
- see rating
- see review date
- see verified purchase
- hide inappropriate reviews

Do NOT let admins secretly modify customer ratings/reviews.

If moderation is implemented, use:

```text
PENDING
APPROVED
HIDDEN
```

---

# 37. DATABASE REVIEW MODEL

Inspect the current Prisma schema first.

A review entity may conceptually contain:

```text
id
customerId
productId
orderId
rating
review
status
createdAt
updatedAt
```

Use proper relationships:

```text
Customer
   ↓
Review
   ↓
Product

Review
   ↓
Order
```

Do not blindly copy this schema if existing architecture suggests a better implementation.

---

# 38. INVOICE / BILL

Customers must be able to download their invoice/bill.

Inside:

```text
My Account
→ My Orders
→ Order Details
```

Add:

# Download Invoice

---

# 39. INVOICE DATA INTEGRITY

The invoice must use the historical order data.

Do NOT calculate old invoices from the current product database.

The invoice must remain correct even if:

- product price changes
- product name changes
- product image changes
- product is archived
- product is removed

Use existing order item snapshots as the historical source of truth.

---

# 40. INVOICE PDF

Generate a professional PDF.

Header:

```text
WHITE MONKEY TOYS

Invoice / Bill
```

Include:

### Store

- store name
- logo
- address
- phone
- email

### Invoice

- invoice number
- order number
- invoice date
- order date
- order status
- payment method

### Customer

- name
- phone
- email
- address
- city
- state
- pincode

### Products

```text
Product | SKU | Qty | Price | Total
```

### Totals

```text
Subtotal
Discount
Shipping
----------------
TOTAL
```

Use actual backend order values.

---

# 41. ORDER RECEIPT PDF

In addition to the invoice, customers can download:

# Order Receipt

This should be a simpler customer-friendly document.

Add:

```text
[Download Invoice]
[Download Order Receipt]
```

---

# 42. RECEIPT CONTENT

Receipt should contain:

```text
WHITE MONKEY TOYS

ORDER RECEIPT

Order Number
Order Date
Customer
Delivery Address
Products
Quantity
Prices
Subtotal
Discount
Shipping
Total
Payment Method
Order Status

Thank you for shopping with
WHITE MONKEY TOYS
```

Make it visually polished and printable.

---

# 43. PDF DOWNLOAD EXPERIENCE

When generating:

```text
Generating PDF...
```

After success:

```text
✓ Invoice downloaded
```

On failure:

```text
Unable to generate the document.
Please try again.
```

Do not leave the user uncertain whether the operation succeeded.

---

# 44. PDF SECURITY

Backend endpoints such as:

```text
GET /orders/:id/invoice
GET /orders/:id/receipt
```

must:

1. Authenticate the customer.
2. Verify order ownership.
3. Generate the PDF.
4. Return the PDF securely.

Never allow:

```text
/customer/order/123
```

to expose another customer's order simply by changing `123`.

---

# 45. PDF FILE NAMING

Use clean filenames such as:

```text
white-monkey-toys-invoice-WMT-20261002-0012.pdf

white-monkey-toys-receipt-WMT-20261002-0012.pdf
```

---

# 46. ORDER DOCUMENTS UI

Inside order details:

```text
Order Documents

┌────────────────────────────────────┐
│ Invoice                            │
│ Official purchase invoice          │
│                         Download   │
├────────────────────────────────────┤
│ Order Receipt                      │
│ Summary of your completed order   │
│                         Download   │
└────────────────────────────────────┘
```

Make this responsive.

---

# 47. DELIVERED ORDER EXPERIENCE

When order becomes:

```text
DELIVERED
```

show:

```text
Your order has been delivered 🎉
```

Then surface:

```text
Download Invoice
Download Receipt
Rate Your Products
```

For each purchased product:

```text
Remote Control Car

★★★★★
Write a Review
```

Do not force users to review.

---

# 48. PROFILE

Customer profile should allow:

- Name
- Email
- Mobile
- Address information where appropriate
- Password change

Use proper validation.

---

# 49. LOADING STATES

Every API-driven page should have proper loading states.

Use:

- skeleton loaders
- button loaders
- page loading
- image placeholders

Never display blank screens while waiting for APIs.

---

# 50. ERROR STATES

Create polished error states.

Examples:

### Network

```text
Something went wrong.
Please try again.
```

### Empty Cart

```text
Your cart is waiting for something fun.
```

### No Products

```text
No toys found.
```

### Login

```text
Email or password is incorrect.
```

### Session

```text
Your session has expired.
Please log in again.
```

Never expose raw backend stack traces.

---

# 51. TOASTS

Use subtle notifications for:

- Added to cart
- Removed from cart
- Login successful
- Signup successful
- Logout
- Order placed
- Profile updated
- Review submitted
- Invoice downloaded
- Receipt downloaded
- Errors

Do not overuse toasts.

---

# 52. MICRO-INTERACTIONS

Add subtle interactions:

- button hover
- card hover
- image transition
- cart updates
- skeleton animation
- dropdown animation
- toast animation
- order status transition

Animations should be:

- fast
- subtle
- useful

Do not over-animate.

---

# 53. RESPONSIVE DESIGN

The complete application must work on:

```text
320px
375px
390px
414px
768px
1024px
1280px
1440px
1920px
```

Pay special attention to:

- navbar
- product grid
- cart
- checkout
- login
- signup
- account
- orders
- tracking
- reviews
- invoices
- modals
- filters

No:

- horizontal scrolling
- clipped content
- overlapping buttons
- broken layouts
- unusable forms

---

# 54. MOBILE EXPERIENCE

Mobile is extremely important.

Use:

- thumb-friendly controls
- sticky useful CTAs
- compact navigation
- optimized product grids
- bottom-sheet style interactions where appropriate
- readable order timelines
- easy PDF download buttons

Do not simply shrink the desktop layout.

Design mobile intentionally.

---

# 55. SEO

Improve storefront SEO.

Use:

- metadata
- title
- description
- canonical URLs
- Open Graph
- Twitter cards
- structured product metadata where appropriate
- sitemap
- robots.txt
- semantic HTML

Customer-facing brand must be:

# White Monkey Toys

Do not expose "Khilona" in SEO metadata.

---

# 56. ACCESSIBILITY

Follow accessibility best practices.

Ensure:

- keyboard navigation
- proper labels
- focus states
- semantic HTML
- alt text
- sufficient contrast
- accessible forms
- accessible dialogs
- screen-reader-friendly states

Do not use color alone to communicate order status.

---

# 57. PERFORMANCE

Do not sacrifice performance for UI.

Optimize:

- images
- Next.js rendering
- API requests
- caching
- product lists
- search
- loading states

Avoid unnecessary client components.

Use server rendering where appropriate.

---

# 58. ADMIN PANEL

Do not unnecessarily redesign the admin panel.

The primary redesign is the customer storefront.

However, ensure:

- admin can manage products
- admin can manage categories
- admin can manage orders
- order status changes update customer tracking
- product changes appear on storefront
- review management works if implemented
- store settings continue working

---

# 59. BACKEND BUSINESS RULES

DO NOT BREAK existing rules.

Especially:

### Pricing

Prices must be validated server-side.

### Stock

Stock must be validated/reserved server-side.

### Order snapshots

Historical order data must remain unchanged.

### Order numbers

Continue existing order numbering logic.

### Order lifecycle

Preserve:

```text
PENDING
CONFIRMED
PROCESSING
READY
OUT_FOR_DELIVERY
DELIVERED
```

and:

```text
CANCELLED
```

### Cancellation

Preserve existing cancellation rules.

### Store closed state

When store is closed, ordering behavior must remain correct.

---

# 60. CUSTOMER-ORDER RELATIONSHIP

Customer accounts must properly connect to orders.

Desired architecture:

```text
Customer
   │
   ├── Profile
   │
   ├── Orders
   │     │
   │     ├── Order Items
   │     ├── Delivery
   │     ├── Tracking
   │     ├── Invoice
   │     └── Receipt
   │
   └── Reviews
```

Existing guest orders must continue working.

Do not break historical orders.

---

# 61. GUEST → ACCOUNT COMPATIBILITY

If a guest customer later creates an account, design a safe mechanism to associate eligible previous orders where possible.

Do not automatically merge orders based only on an unverified name.

Use secure matching such as verified:

- mobile
- email
- order information

depending on existing architecture.

---

# 62. SECURITY

Security is critical.

Never:

- store passwords in plain text
- store sensitive JWT tokens in localStorage
- expose customer orders
- expose admin APIs
- trust frontend prices
- trust frontend stock
- allow insecure account linking
- allow unauthorized reviews
- expose invoice URLs publicly

Enforce authorization server-side.

---

# 63. API DESIGN

Before creating new endpoints, inspect existing API conventions.

Follow existing naming and response formats.

Potential functionality:

```text
POST /auth/customer/signup
POST /auth/customer/login
POST /auth/customer/logout
GET  /customer/profile
PATCH /customer/profile

GET /customer/orders
GET /customer/orders/:id

GET /orders/:id/invoice
GET /orders/:id/receipt

POST /products/:id/reviews
GET /products/:id/reviews
PATCH /reviews/:id
DELETE /reviews/:id

GET /orders/track
```

These are conceptual examples only.

**Do not create duplicate or conflicting APIs if equivalent endpoints already exist.**

---

# 64. DATABASE MIGRATIONS

Before changing Prisma:

1. Inspect existing schema.
2. Reuse existing models.
3. Add only required fields/tables.
4. Create proper migration.
5. Ensure existing production-style data remains compatible.

Never delete existing customer/order data just to make the new schema work.

---

# 65. UI COMPONENT SYSTEM

Create reusable components instead of duplicating UI.

Examples:

```text
Header
Footer
ProductCard
CategoryCard
Button
Input
Modal
Toast
OrderStatusTimeline
OrderCard
ReviewCard
RatingStars
InvoiceButton
ReceiptButton
EmptyState
Skeleton
```

Keep components reusable and consistent.

---

# 66. DESIGN CONSISTENCY

All screens should feel like one product.

Maintain consistency for:

- buttons
- typography
- borders
- cards
- icons
- spacing
- colors
- inputs
- modals
- status badges
- notifications

---

# 67. NO GENERIC UI

Do not use generic template layouts without adapting them.

The website should feel specifically designed for:

# WHITE MONKEY TOYS

Every major page should feel branded.

---

# 68. CHECKOUT CONVERSION

The checkout should minimize friction.

Do not add unnecessary fields.

Clearly show:

```text
What you are buying
How much it costs
Where it is going
How it will be delivered
How to place the order
```

Make the final CTA extremely clear.

---

# 69. TRUST

Build trust through UI, not fake claims.

Use real store information from the database/settings.

Potential trust indicators:

- Pay on Delivery
- Easy ordering
- Order tracking
- Secure account
- Verified reviews

Only display claims that are actually true.

---

# 70. ACCESSIBLE ORDER STATUS

Do not rely only on colors.

Use:

- icon
- label
- timeline
- date/time

For example:

```text
✓ Delivered
```

rather than only a green badge.

---

# 71. CUSTOMER DOCUMENTS

Customer account should provide easy access to:

```text
Orders
Invoices
Receipts
Reviews
```

Do not hide important actions inside too many menus.

---

# 72. REVIEW UX

Reviews should feel natural.

Do not show aggressive popups.

Prefer:

```text
Delivered
↓
Rate Your Product
↓
Optional Review
```

This should feel like part of the order experience.

---

# 73. ORDER CONFIRMATION

After placing an order, create a premium confirmation page.

Example:

```text
✓ Order Placed Successfully

Thank you for shopping with
WHITE MONKEY TOYS

Order #WMT-20261002-0012

We'll keep you updated about your order.

[Track Order]

[Continue Shopping]
```

If the customer is logged in, also show:

```text
[View My Orders]
```

---

# 74. ORDER SUCCESS UX FOR GUESTS

Guests should receive:

- order number
- order summary
- tracking instructions
- mobile/order-based tracking CTA

Encourage account creation without requiring it.

---

# 75. ADMIN ORDER STATUS → CUSTOMER

When admin changes:

```text
PENDING
→ CONFIRMED
→ PROCESSING
→ READY
→ OUT_FOR_DELIVERY
→ DELIVERED
```

the customer's tracking page should automatically reflect the latest state.

Use proper cache invalidation/refetching.

Do not show stale order status unnecessarily.

---

# 76. REVIEW → PRODUCT

When a review is approved/visible:

It should appear on the corresponding product page.

Show:

```text
Average Rating
Total Reviews
Rating Distribution
Individual Reviews
```

---

# 77. HISTORICAL DATA

Historical orders are extremely important.

If a product changes after purchase:

```text
Old Order
```

must continue showing:

- original product name
- original SKU
- original options
- original price
- original quantity
- original image where stored

Do not recalculate historical orders from current product records.

---

# 78. TESTING

After implementation run:

```bash
npm run lint
npm run build
npm run test:api
npm run test:e2e:user
npm run test:e2e:admin
```

Fix all meaningful errors.

Do not disable tests simply to make the build pass.

---

# 79. TEST AUTHENTICATION

Test:

```text
Signup
Login
Logout
Duplicate signup
Invalid password
Expired session
Protected pages
```

---

# 80. TEST ORDER SECURITY

Test:

```text
Customer A → sees own orders
Customer A → cannot see Customer B orders

Customer A → can download own invoice
Customer A → cannot download Customer B invoice

Customer A → can download own receipt
Customer A → cannot download Customer B receipt
```

---

# 81. TEST REVIEWS

Test:

```text
Delivered purchaser → can review
Non-purchaser → cannot review
Pending order → cannot review
Processing order → cannot review
Delivered order → can review
Duplicate review → blocked
```

---

# 82. TEST GUEST CHECKOUT

Ensure:

```text
Guest
↓
Browse
↓
Cart
↓
Checkout
↓
Place Order
↓
Track Order
```

still works.

---

# 83. TEST PDFS

Test:

```text
Invoice generation
Receipt generation
Correct totals
Correct customer
Correct order
Correct historical prices
Correct products
Unauthorized access blocked
```

---

# 84. TEST RESPONSIVENESS

Check at least:

```text
320
375
390
414
768
1024
1280
1440
1920
```

---

# 85. FINAL QUALITY CHECK

Before considering the task complete, verify:

### Branding

- White Monkey Toys everywhere customer-facing
- clean black logo
- consistent typography

### Authentication

- signup works
- login works
- logout works
- account works

### Shopping

- categories
- products
- product details
- cart
- checkout

### Orders

- order placement
- order history
- tracking
- guest tracking
- status updates

### Reviews

- delivered-only reviews
- verified purchase
- duplicate protection
- product review display

### Documents

- invoice PDF
- receipt PDF
- secure downloads

### UX

- responsive
- premium
- fast
- accessible
- intuitive

### Admin

- existing functionality remains intact

---

# 86. DO NOT ADD UNREQUESTED FEATURES

Do NOT randomly add:

- payment gateway
- delivery partner integration
- subscriptions
- loyalty programs
- cryptocurrency
- unnecessary AI
- complicated recommendation engines
- unnecessary dashboards

Focus on:

# WHITE MONKEY TOYS

with:

- Premium storefront
- Customer accounts
- Guest checkout
- Order tracking
- Order history
- Product reviews
- Invoice PDF
- Order receipt PDF
- Premium UI/UX

---

# 87. IMPLEMENTATION WORKFLOW

Follow this exact workflow.

## STEP 1 — AUDIT

Inspect everything first.

## STEP 2 — PLAN

Identify:

- backend changes
- database changes
- APIs
- frontend changes
- components
- tests

## STEP 3 — DATABASE

Create only necessary migrations.

## STEP 4 — BACKEND

Implement:

- customer auth
- profile
- orders
- reviews
- invoice
- receipt
- authorization

## STEP 5 — USER PANEL

Implement:

- branding
- homepage
- product UI
- cart
- checkout
- auth
- account
- orders
- tracking
- reviews
- PDFs

## STEP 6 — RESPONSIVE

Test desktop/tablet/mobile.

## STEP 7 — TEST

Run all existing and new tests.

## STEP 8 — POLISH

Fix:

- spacing
- typography
- loading states
- errors
- animations
- responsiveness
- accessibility

---

# 88. IMPORTANT CODING RULE

Before creating a new file/component/service:

**Search the project to see whether equivalent functionality already exists.**

Reuse existing:

- services
- hooks
- API clients
- components
- authentication
- validation
- types
- utilities

Do not duplicate functionality.

---

# 89. IMPORTANT ARCHITECTURE RULE

Business logic belongs in the backend.

The frontend should not be responsible for:

- final pricing
- stock validation
- review eligibility
- order ownership
- authorization
- invoice ownership
- receipt ownership

The backend must remain the source of truth.

---

# 90. FINAL CUSTOMER JOURNEY

The final experience should be:

```text
                    WHITE MONKEY TOYS
                           │
                           ▼
                      Browse Toys
                           │
                           ▼
                    Product Details
                           │
                           ▼
                       Add Cart
                           │
                           ▼
                       Checkout
                           │
             ┌─────────────┴─────────────┐
             │                           │
          Guest                         Account
             │                           │
             └─────────────┬─────────────┘
                           ▼
                     Place Order
                           │
                           ▼
                    Order Confirmation
                           │
                           ▼
                    Track Order
                           │
                           ▼
                      PROCESSING
                           │
                           ▼
                  OUT FOR DELIVERY
                           │
                           ▼
                       DELIVERED
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
          Invoice       Receipt       Review
             PDF           PDF        Product
```

Everything should feel like one seamless product experience.

---

# 91. FINAL DESIGN STANDARD

The final result must NOT feel like:

> "A CRUD project with a shopping cart."

It must feel like:

> **A professional premium toy-store e-commerce platform built for a real business.**

The customer should immediately understand:

1. What White Monkey Toys sells
2. How to browse products
3. How to purchase
4. How to create an account
5. How to track an order
6. How to see previous orders
7. How to download their invoice
8. How to download their receipt
9. How to review products they received

---

# 92. FINAL BRAND STANDARD

Use:

```text
Brand:
WHITE MONKEY TOYS

Style:
Premium
Minimal
Modern
Playful
Trustworthy

Primary:
Black

Background:
White / Soft Neutral

Typography:
Modern Sans Serif

Logo:
Black Wordmark

Audience:
Parents
Families
Gift Buyers
Toy Shoppers
```

---

# 93. FINAL INSTRUCTION TO CLAUDE

Do not simply explain what should be done.

**Actually inspect the existing codebase and implement the changes.**

Do not rebuild working functionality.

Do not delete existing data.

Do not break existing APIs unnecessarily.

Do not remove guest checkout.

Do not break admin order management.

Do not break stock management.

Do not break product/category management.

Do not break existing authentication.

Do not compromise security for convenience.

Do not use fake data where real backend data already exists.

Do not hard-code dynamic business data.

Do not create duplicate APIs or components when equivalent functionality already exists.

After implementation, run the available tests and builds.

---

# 94. FINAL RESPONSE REQUIRED FROM YOU

When implementation is complete, provide a concise implementation report:

## Changed

- ...

## New Features

- Customer signup/login
- Customer accounts
- Order tracking
- Product reviews
- Verified purchase reviews
- Invoice PDF
- Order receipt PDF
- Premium UI/UX
- White Monkey Toys branding

## Backend Changes

- ...

## Database Changes

- ...

## API Changes

- ...

## Frontend Changes

- ...

## Security Changes

- ...

## Tests

- ...

## Build Status

- ...

## Remaining Issues

- ...

Do not claim something works unless you actually verified it.

The final application should be **production-ready, secure, responsive, premium, and fully branded as WHITE MONKEY TOYS.**