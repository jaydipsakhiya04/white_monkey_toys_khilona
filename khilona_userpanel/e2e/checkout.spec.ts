import { expect, test, type Page } from "@playwright/test";

// prefix is configurable (ORDER_NUMBER_PREFIX); older orders may still use the previous one
const ORDER_NUMBER = /^[A-Z]{2,6}-\d{8}-\d{4,}$/;
const API_URL = (process.env.E2E_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/+$/, "");
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@khilona.in";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "Admin@12345";

/** On a PDP: pick the first available value for every option group that isn't selected yet. */
async function chooseOptionsIfNeeded(page: Page) {
  const groups = page.locator("fieldset").filter({ has: page.locator("button[aria-pressed]") });
  const count = await groups.count();
  for (let i = 0; i < count; i++) {
    const group = groups.nth(i);
    if ((await group.locator('button[aria-pressed="true"]').count()) > 0) continue;
    await group.locator("button[aria-pressed]:not([disabled])").first().click();
  }
}

/** Open the first in-stock product on the current listing page. */
async function openFirstInStockProduct(page: Page) {
  const cards = page.locator("article").filter({ hasNot: page.getByText("Out of stock", { exact: true }) });
  await expect(cards.first()).toBeVisible();
  await cards.first().locator("h3 a").click();
  await expect(page.getByTestId("add-to-cart")).toBeVisible();
}

test.describe("critical purchase flow", () => {
  test("home → category → product → cart → checkout → success", async ({ page, request }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // category from the home grid
    const categoryLink = page
      .locator('section[aria-labelledby="cats-title"] a[href^="/category/"]')
      // link text is "<name><count> products" (no separator), so don't anchor on a word boundary
      .filter({ hasText: /[1-9]\d* products?$/ })
      .first();
    await expect(categoryLink).toBeVisible();
    await categoryLink.click();
    await expect(page).toHaveURL(/\/category\//);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // product (pick variant if needed)
    await openFirstInStockProduct(page);
    await chooseOptionsIfNeeded(page);
    const addButton = page.getByTestId("add-to-cart");
    await expect(addButton).toHaveText(/Add to cart/);
    await addButton.click();
    await expect(page.getByText("Added to cart").first()).toBeVisible();

    // cart
    await page.goto("/cart");
    await expect(page.getByTestId("cart-line")).toHaveCount(1);
    const proceed = page.getByRole("button", { name: "Proceed to checkout" });
    await expect(proceed).toBeEnabled();
    await expect(page.getByTestId("order-total")).toBeVisible();
    await proceed.click();
    await expect(page).toHaveURL(/\/checkout/);

    // step 1: contact
    await page.getByLabel("Full name").fill("Playwright Tester");
    await page.getByLabel("Mobile number", { exact: true }).fill("+91 98765 43210");
    await page.getByLabel(/Email/).fill("tester@example.com");
    await page.getByRole("button", { name: /Continue/ }).click();

    // step 2: address
    await expect(page.getByRole("heading", { name: /Delivery address/ })).toBeVisible();
    await page.getByLabel("Full address").fill("Flat 12, Test Residency, MG Road, Navrangpura");
    await page.getByLabel("City").fill("Ahmedabad");
    await page.getByLabel("State").fill("Gujarat");
    await page.getByLabel("Pincode").fill("380009");
    await page.getByLabel(/Landmark/).fill("Near Test Garden");
    await page.getByLabel(/Special note/).fill("Automated e2e test order — please ignore.");
    await page.getByRole("button", { name: /Continue/ }).click();

    // step 3: review + place
    await expect(page.getByRole("heading", { name: "Review your order" })).toBeVisible();
    await expect(page.getByText(/Cash \/ Pay on delivery/).first()).toBeVisible();
    const place = page.getByTestId("place-order");
    await expect(place).toBeEnabled();
    await place.click();

    await expect(page).toHaveURL(/\/order\/success\//, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Order Placed Successfully" })).toBeVisible();
    const orderNumber = (await page.getByTestId("order-number").textContent())?.trim() ?? "";
    expect(orderNumber).toMatch(ORDER_NUMBER);
    await expect(page.getByText("Playwright Tester")).toBeVisible();

    // revisiting without the session snapshot asks for phone verification (GET /orders/track)
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await expect(page.getByRole("heading", { name: "View your order" })).toBeVisible();
    await page.getByLabel("Mobile number").fill("9876543210");
    await page.getByRole("button", { name: "Show my order" }).click();
    await expect(page.getByTestId("order-number")).toHaveText(orderNumber);

    // track order page shows the status timeline
    await page.goto(`/track-order?orderNumber=${orderNumber}`);
    await page.getByLabel("Mobile number").fill("98765 43210");
    await page.getByRole("button", { name: "Track order" }).click();
    await expect(page.getByRole("list", { name: "Order status" })).toBeVisible();
    await expect(page.getByRole("heading", { name: orderNumber })).toBeVisible();

    // cart was cleared
    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();

    // clean up: cancel the test order via the admin API so seeded stock is restored
    const auth = await request.post(`${API_URL}/auth/login`, { data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
    expect(auth.ok(), "admin login for cleanup").toBeTruthy();
    const token = (await auth.json()).data.accessToken as string;
    const cancel = await request.patch(`${API_URL}/admin/orders/${orderNumber}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: "CANCELLED", note: "Automated storefront e2e cleanup" },
    });
    expect(cancel.ok(), await cancel.text()).toBeTruthy();
  });
});

test.describe("cart", () => {
  test("simple product: add to cart and change quantity", async ({ page }) => {
    await page.goto("/products?inStock=true&sort=name_asc");
    const quickAdd = page.getByRole("button", { name: /^Add .* to cart$/ }).first();
    await expect(quickAdd).toBeVisible();
    const label = (await quickAdd.getAttribute("aria-label")) ?? "";
    const productName = label.replace(/^Add /, "").replace(/ to cart$/, "");
    await quickAdd.click();
    await expect(page.getByText("Added to cart").first()).toBeVisible();

    await page.goto("/cart");
    const line = page.getByTestId("cart-line");
    await expect(line).toHaveCount(1);
    await expect(line).toContainText(productName);

    const qty = line.getByRole("spinbutton");
    await expect(qty).toHaveValue("1");
    const total = page.getByTestId("order-total");
    await expect(total).toBeVisible();
    const before = await total.textContent();

    await line.getByRole("button", { name: /Increase quantity/ }).click();
    await expect(qty).toHaveValue("2");
    await expect(total).not.toHaveText(before ?? "");

    // persisted across reloads
    await page.reload();
    await expect(page.getByTestId("cart-line").getByRole("spinbutton")).toHaveValue("2");

    await page.getByTestId("cart-line").getByRole("button", { name: /Decrease quantity/ }).click();
    await expect(page.getByTestId("cart-line").getByRole("spinbutton")).toHaveValue("1");

    // remove → empty state
    await page.getByRole("button", { name: `Remove ${productName} from cart` }).click();
    await expect(page.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
  });

  test("variant product requires option selection", async ({ page }) => {
    await page.goto("/products?sort=featured");
    const choose = page.getByRole("link", { name: /^Choose options for / }).first();
    await expect(choose).toBeVisible();
    await choose.click();
    const add = page.getByTestId("add-to-cart");
    await expect(add).toHaveText(/Select /);
    await add.click();
    await expect(page.getByRole("alert").filter({ hasText: /to continue/ })).toBeVisible();
    await chooseOptionsIfNeeded(page);
    await expect(add).toHaveText(/Add to cart/);
  });
});

test.describe("checkout error handling", () => {
  async function addFirstSimpleProductAndGoToReview(page: Page) {
    await page.goto("/products?inStock=true&sort=name_asc");
    await page.getByRole("button", { name: /^Add .* to cart$/ }).first().click();
    await expect(page.getByText("Added to cart").first()).toBeVisible();
    await page.goto("/checkout");
    await page.getByLabel("Full name").fill("Error Case");
    await page.getByLabel("Mobile number", { exact: true }).fill("9876543210");
    await page.getByRole("button", { name: /Continue/ }).click();
    await page.getByLabel("Full address").fill("House 1, Some Street, Some Area");
    await page.getByLabel("City").fill("Ahmedabad");
    await page.getByLabel("State").fill("Gujarat");
    await page.getByLabel("Pincode").fill("380009");
    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page.getByRole("heading", { name: "Review your order" })).toBeVisible();
  }

  test("validation: invalid phone and pincode are rejected client-side", async ({ page }) => {
    await page.goto("/products?inStock=true&sort=name_asc");
    await page.getByRole("button", { name: /^Add .* to cart$/ }).first().click();
    await page.goto("/checkout");
    await page.getByLabel("Full name").fill("Val Idation");
    await page.getByLabel("Mobile number", { exact: true }).fill("12345");
    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page.getByText(/valid 10-digit Indian mobile/)).toBeVisible();
    await page.getByLabel("Mobile number", { exact: true }).fill("09876543210");
    await page.getByRole("button", { name: /Continue/ }).click();
    await page.getByLabel("Pincode").fill("12ab");
    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page.getByText("Enter a valid 6-digit pincode")).toBeVisible();
  });

  test("409 stock conflict is shown with a link to the cart (mocked)", async ({ page }) => {
    await addFirstSimpleProductAndGoToReview(page);
    await page.route("**/orders", (route) =>
      route.request().method() === "POST"
        ? route.fulfill({
            status: 409,
            contentType: "application/json",
            body: JSON.stringify({
              success: false,
              statusCode: 409,
              message: "Some items in your cart need attention",
              errors: [{ field: "items.0", message: "Only 0 left in stock" }],
            }),
          })
        : route.continue(),
    );
    await page.getByTestId("place-order").click();
    await expect(page.getByText("Some items in your cart need attention")).toBeVisible();
    await expect(page.getByRole("link", { name: "Review your cart" })).toBeVisible();
    await expect(page).toHaveURL(/\/checkout/);
  });

  test("403 store closed message is shown (mocked)", async ({ page }) => {
    await addFirstSimpleProductAndGoToReview(page);
    await page.route("**/orders", (route) =>
      route.request().method() === "POST"
        ? route.fulfill({
            status: 403,
            contentType: "application/json",
            body: JSON.stringify({ success: false, statusCode: 403, message: "We are not accepting orders right now", errors: [] }),
          })
        : route.continue(),
    );
    await page.getByTestId("place-order").click();
    await expect(page.getByText("We are not accepting orders right now")).toBeVisible();
  });
});

test.describe("seo + misc", () => {
  test("product page has JSON-LD and canonical", async ({ page, request }) => {
    await page.goto("/products");
    const href = await page.locator("article h3 a").first().getAttribute("href");
    expect(href).toBeTruthy();
    const res = await request.get(href!);
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain('"@type":"Product"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toMatch(/<link rel="canonical" href="[^"]*\/product\//);
  });

  test("unknown product returns 404", async ({ request }) => {
    const res = await request.get("/product/this-does-not-exist-123");
    expect(res.status()).toBe(404);
  });
});

test.describe("listing filters", () => {
  test("filters, sort and search are reflected in the URL", async ({ page, isMobile }) => {
    await page.goto("/products");
    if (isMobile) {
      await page.getByRole("button", { name: /^Filters/ }).click();
      const sheet = page.getByRole("dialog", { name: "Filters" });
      await expect(sheet).toBeVisible();
      await sheet.getByRole("switch", { name: "In stock only" }).click();
      await sheet.getByRole("button", { name: "Show results" }).click();
      await expect(sheet).toBeHidden();
    } else {
      await page.getByRole("complementary", { name: "Filters" }).getByRole("switch", { name: "In stock only" }).click();
    }
    await expect(page).toHaveURL(/inStock=true/);
    await expect(page.getByRole("button", { name: "Remove filter In stock" })).toBeVisible();

    await page.getByLabel("Sort by").selectOption("price_asc");
    await expect(page).toHaveURL(/sort=price_asc/);

    const search = page.getByRole("searchbox", { name: "Search all products" });
    await search.fill("zzzz-no-such-toy");
    await search.press("Enter");
    await expect(page).toHaveURL(/search=zzzz-no-such-toy/);
    await expect(page.getByRole("heading", { name: "No search results" })).toBeVisible();
  });
});
