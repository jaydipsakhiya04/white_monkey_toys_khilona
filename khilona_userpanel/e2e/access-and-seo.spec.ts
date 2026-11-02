import { expect, test } from "@playwright/test";
import { API_URL, signInAsNewCustomer } from "./auth";

test.describe("guests can browse but actions need an account", () => {
  test("add to cart sends a guest to log in and back", async ({ page }) => {
    await page.goto("/products?inStock=true&sort=name_asc");
    await page.getByRole("button", { name: /^Add .* to cart$/ }).first().click();
    await expect(page).toHaveURL(/\/login\?next=%2Fproducts/);
  });

  test("checkout asks guests to log in", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: "Log in to place your order" })).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: "Log in" })).toHaveAttribute("href", /\/login\?next=%2Fcheckout/);
  });

  test("messaging the store needs an account, the address and phone stay visible", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByText("Email us").locator("xpath=ancestor::a")).toHaveAttribute("href", /^\/login\?next=/);
    await expect(page.getByRole("main").getByRole("link", { name: /WhatsApp/ }).first()).toHaveAttribute("href", /^\/login\?next=/);
    await expect(page.getByRole("main").getByText(/Surat/).first()).toBeVisible();
  });

  test("the API refuses guest orders", async ({ request }) => {
    const res = await request.post(`${API_URL}/orders`, {
      data: { customerName: "Guest", phone: "9876500099", address: "12 Test Lane", city: "Surat", state: "Gujarat", pincode: "395006", items: [{ productId: "x", quantity: 1 }] },
    });
    // 401 (not signed in) — or 422 if input validation runs first; never 201
    expect([401, 422]).toContain(res.status());
  });
});

test.describe("wholesale", () => {
  test("guests see the enquiry but must log in to send it", async ({ page }) => {
    await page.goto("/wholesale");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/wholesale/i);
    await expect(page.getByRole("button", { name: "Log in to request pricing" })).toBeVisible();
    await page.getByLabel("Shop / business name").fill("Toy World");
    await page.getByLabel("Your name").fill("Ravi");
    await page.getByLabel("Mobile number").fill("9876512345");
    await page.getByLabel("Approximate quantity").selectOption({ index: 2 });
    await page.getByRole("button", { name: "Log in to request pricing" }).click();
    await expect(page).toHaveURL(/\/login\?next=%2Fwholesale/);
  });

  test("customers send the enquiry on WhatsApp, prefilled", async ({ page, context }) => {
    const me = await signInAsNewCustomer(page, "Wholesale Buyer");
    await page.goto("/wholesale");
    await expect(page.getByLabel("Your name")).toHaveValue(me.name);
    await page.getByText("Wholesale price", { exact: true }).click();
    await page.getByLabel("Shop / business name").fill("Toy World");
    await page.getByLabel("Approximate quantity").selectOption({ index: 3 });
    const [popup] = await Promise.all([context.waitForEvent("page"), page.getByRole("button", { name: "Request pricing" }).click()]);
    await popup.waitForURL(/wa.me|whatsapp/).catch(() => {});
    const url = decodeURIComponent(popup.url()).replace(/\+/g, " ");
    expect(url).toMatch(/wa\.me|whatsapp/);
    expect(url).toContain("wholesale price list");
    expect(url).toContain("Toy World");
    await popup.close();
  });
});

test.describe("local seo", () => {
  test("home page describes a toy store in Surat (structured data + copy)", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).toContain('"@type":"ToyStore"');
    expect(html).toContain('"addressLocality":"Surat"');
    expect(html).toContain('"@type":"FAQPage"');
    expect(html).toMatch(/toy shop in Surat/i);
    expect(html).toMatch(/<meta name="keywords" content="[^"]*toy shop in Varachha/i);
  });

  test("wholesale page targets wholesale searches", async ({ request }) => {
    const html = await (await request.get("/wholesale")).text();
    expect(html).toMatch(/<title>Wholesale Toys in Surat/);
    expect(html).toMatch(/<link rel="canonical" href="[^"]*\/wholesale"/);
    expect(html).toContain('"@type":"FAQPage"');
  });

  test("sitemap lists the wholesale page", async ({ request }) => {
    expect(await (await request.get("/sitemap.xml")).text()).toContain("/wholesale</loc>");
  });
});
