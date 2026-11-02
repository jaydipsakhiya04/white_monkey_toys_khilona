import { expect, type Page } from "@playwright/test";

export const API_URL = (process.env.E2E_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/+$/, "");

/** A unique valid Indian mobile + email per call. */
export function newIdentity(label = "Playwright Buyer") {
  const n = `${Date.now()}${Math.floor(Math.random() * 100)}`.slice(-9);
  return { name: label, email: `pw.${n}@example.com`, phone: `8${n}`, password: "Toys2026pw" };
}

/**
 * Ordering needs an account. Creates a fresh customer through the API; `page.request` shares the
 * browser context's cookies, so the storefront picks up the session (refresh cookie) on next load.
 */
export async function signInAsNewCustomer(page: Page, label?: string) {
  const me = newIdentity(label);
  const res = await page.request.post(`${API_URL}/auth/customer/signup`, { data: me });
  expect(res.ok(), `customer signup: ${await res.text()}`).toBeTruthy();
  // the storefront only restores a session when its "signed in" hint is present (lib/auth/session.ts)
  await page.addInitScript(() => localStorage.setItem("wmt-signed-in", "1"));
  return me;
}
