import { expect, test } from "@playwright/test";

const API_URL = (process.env.E2E_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/+$/, "");
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@khilona.in";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "Admin@12345";

/** A unique valid Indian mobile + email per run. */
function identity() {
  const n = `${Date.now()}${Math.floor(Math.random() * 10)}`.slice(-9);
  return { name: "Playwright Parent", email: `pw.${n}@example.com`, phone: `7${n}`, password: "Toys2026pw" };
}

test.describe("customer accounts", () => {
  test("signup → signed-in checkout → My Orders → order details → receipt → logout", async ({ page, request }) => {
    const me = identity();

    // signup (inline validation first)
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Please enter your full name")).toBeVisible();
    await page.getByLabel("Full name").fill(me.name);
    await page.getByLabel("Email").fill(me.email);
    await page.getByLabel("Mobile number").fill(me.phone);
    await page.getByLabel("Password", { exact: true }).fill(me.password);
    await page.getByLabel("Confirm password").fill("Mismatch123");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Passwords don't match")).toBeVisible();
    await page.getByLabel("Confirm password").fill(me.password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/account$/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Hello, Playwright" })).toBeVisible();

    // tokens are never persisted in web storage
    const stored = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
    expect(stored).not.toMatch(/eyJ[\w-]+\.[\w-]+\./);

    // add a simple product and check out — details are prefilled from the account
    await page.goto("/products?inStock=true&sort=name_asc");
    await page.getByRole("button", { name: /^Add .* to cart$/ }).first().click();
    await expect(page.getByText("Added to cart").first()).toBeVisible();
    await page.goto("/checkout");
    await expect(page.getByText(/this order will be saved to your account/)).toBeVisible();
    await expect(page.getByLabel("Full name")).toHaveValue(me.name);
    await expect(page.getByLabel("Mobile number", { exact: true })).toHaveValue(me.phone);
    await page.getByRole("button", { name: /Continue/ }).click();
    await page.getByLabel("Full address").fill("Flat 7, Account Residency, Ashram Road");
    await page.getByLabel("City").fill("Ahmedabad");
    await page.getByLabel("State").fill("Gujarat");
    await page.getByLabel("Pincode").fill("380009");
    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page.getByText(/Pay on delivery/).first()).toBeVisible();
    await page.getByTestId("place-order").click();
    await expect(page.getByRole("heading", { name: "Order Placed Successfully" })).toBeVisible({ timeout: 30_000 });
    const orderNumber = (await page.getByTestId("order-number").textContent())?.trim() ?? "";
    await expect(page.getByRole("link", { name: "View my orders" })).toBeVisible();

    // My Orders → order details (session survives a full reload via the httpOnly refresh cookie)
    await page.goto("/account/orders");
    const card = page.getByRole("link", { name: new RegExp(orderNumber) });
    await expect(card).toBeVisible();
    await card.click();
    await expect(page.getByRole("heading", { name: `Order #${orderNumber}` })).toBeVisible();
    await expect(page.getByRole("list", { name: "Order status" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Cancel order/ })).toBeVisible();

    // receipt PDF download
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: /Download\s*Order receipt/ }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe(`white-monkey-toys-receipt-${orderNumber}.pdf`);
    await expect(page.getByText("✓ Receipt downloaded")).toBeVisible();

    // another visitor cannot open this order
    const anon = await request.get(`${API_URL}/customer/orders/${orderNumber}`);
    expect(anon.status()).toBe(401);

    // logout → account pages redirect to login
    if (test.info().project.name.includes("mobile")) {
      await page.getByRole("button", { name: "Log out" }).first().click();
    } else {
      await page.getByRole("button", { name: /^Hi, Playwright/ }).click();
      await page.getByRole("menuitem", { name: "Log out" }).click();
    }
    await expect(page.getByText("You've been logged out")).toBeVisible();
    await page.goto("/account/orders");
    await expect(page).toHaveURL(/\/login\?next=/);

    // wrong password shows a friendly error
    await page.getByLabel("Email or mobile number").fill(me.email);
    await page.getByLabel("Password", { exact: true }).fill("NotMyPassword1");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Email or password is incorrect.")).toBeVisible();

    // clean up: cancel the order so seeded stock is restored
    const auth = await request.post(`${API_URL}/auth/login`, { data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
    const token = (await auth.json()).data.accessToken as string;
    const cancel = await request.patch(`${API_URL}/admin/orders/${orderNumber}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: "CANCELLED", note: "Automated account e2e cleanup" },
    });
    expect(cancel.ok(), await cancel.text()).toBeTruthy();
  });

  test("account pages require login", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login\?next=%2Faccount/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("forgot password is honest when no delivery channel is configured", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel("Email or mobile number").fill("someone@example.com");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText(/isn.t available on our store yet/)).toBeVisible();
  });
});
