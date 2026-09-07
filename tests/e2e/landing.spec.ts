import { test, expect } from '@playwright/test';

test('landing renders German by default, CTA enters the app', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'GitHub', exact: true })).toHaveAttribute(
    'href',
    'https://github.com/smart-byte/wunschplatz',
  );
  await expect(page.getByRole('link', { name: 'Auf GitHub ansehen' })).toHaveAttribute(
    'href',
    'https://github.com/smart-byte/wunschplatz',
  );
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Faire Projektverteilung');
  await page.getByRole('link', { name: 'App starten' }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.locator('h1')).toContainText('Projekte');
});

test('language toggle switches to English and persists across reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Fair project assignment');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Fair project assignment');
});
