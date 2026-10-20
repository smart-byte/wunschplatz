import { test, expect } from '@playwright/test';

test('every app page links to the legal notice and privacy policy', async ({ page }) => {
  await page.goto('/projects');
  const footer = page.getByRole('contentinfo');
  await footer.getByRole('link', { name: 'Impressum' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Impressum' })).toBeVisible();

  await page.getByRole('contentinfo').getByRole('link', { name: 'Datenschutz' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Datenschutzerklärung' })).toBeVisible();
});

test('the development server never loads visit counting', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('script[src*="analytics.smart-byte.com"]')).toHaveCount(0);
});
