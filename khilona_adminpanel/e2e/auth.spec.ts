import { expect, test } from '@playwright/test';
import { ADMIN_EMAIL } from './helpers';

test.describe('authentication', () => {
  test('protected route redirects to login with next param', async ({ page }) => {
    await page.goto('/orders');
    await expect(page).toHaveURL(/\/login\?next=%2Forders/);
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('wrong password shows an error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(ADMIN_EMAIL);
    await page.getByLabel('Password', { exact: true }).fill('definitely-wrong-1');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Incorrect email or password' })).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('client-side validation runs before submitting', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('admin pages are not indexable', async ({ request }) => {
    const res = await request.get('/login');
    expect(res.headers()['x-robots-tag']).toContain('noindex');
    const robots = await request.get('/robots.txt');
    expect(await robots.text()).toContain('Disallow: /');
  });
});
