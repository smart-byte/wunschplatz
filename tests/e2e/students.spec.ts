import { test, expect } from '@playwright/test';

test('row menu edits a student on narrower screens', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto('/students');
  await page.getByRole('button', { name: 'Neuer Schüler', exact: true }).click();
  await page.getByLabel('Vorname', { exact: true }).fill('Anna');
  await page.getByLabel('Nachname', { exact: true }).fill('Beispiel');
  await page.getByLabel('Klasse', { exact: true }).fill('7a');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();

  await page.getByRole('row').filter({ hasText: 'Beispiel, Anna' }).getByTitle('Aktionen').click();
  await page.getByRole('menuitem', { name: 'Bearbeiten', exact: true }).click();
  await expect(page.getByLabel('Vorname', { exact: true })).toHaveValue('Anna');
  await page.getByLabel('Vorname', { exact: true }).fill('Anne');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();

  await expect(page.getByRole('cell', { name: 'Beispiel, Anne', exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
