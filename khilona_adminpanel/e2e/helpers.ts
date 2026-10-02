import { expect, type Page } from '@playwright/test';

export const API_URL = (process.env.E2E_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');
export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@khilona.in';
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'Admin@12345';

export async function login(page: Page, next = '/') {
  await page.goto(`/login${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`);
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
