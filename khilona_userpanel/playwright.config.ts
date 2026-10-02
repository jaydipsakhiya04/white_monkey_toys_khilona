import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config. Defaults to http://localhost:3000 and starts `npm run dev`
 * if nothing is listening there (an existing server is reused).
 * Override with E2E_BASE_URL (e.g. when port 3000 is taken) — the port is
 * taken from that URL for the webServer too.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const port = new URL(baseURL).port || "3000";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["**/screens.spec.ts"],
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npx next dev -p ${port}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
