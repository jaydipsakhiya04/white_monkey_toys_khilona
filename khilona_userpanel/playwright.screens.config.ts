import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

/** Responsive screenshot sweep (not part of the regular e2e run). */
export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: ["**/screens.spec.ts"],
  projects: [{ name: "screens", use: { browserName: "chromium" } }],
  reporter: [["list"]],
  timeout: 300_000,
});
