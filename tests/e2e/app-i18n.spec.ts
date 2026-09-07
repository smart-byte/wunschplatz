import { test, expect } from '@playwright/test';

test('app language toggle switches the whole UI and persists', async ({ page }) => {
  await page.goto('/projects');
  await expect(page.getByRole('link', { name: 'Projekte' })).toBeVisible();

  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Projects' })).toBeVisible();
  await expect(page.locator('h1')).toContainText(/projects/i);

  await page.getByRole('button', { name: 'Import Excel', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Choose file' })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

  await page.goto('/students');
  await page.getByRole('button', { name: 'Import form results', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Choose file' })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

  await page.reload();
  await expect(page.getByRole('link', { name: 'Projects' })).toBeVisible();

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Fair project assignment');
});
