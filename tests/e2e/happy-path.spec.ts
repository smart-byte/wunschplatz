import { test, expect } from '@playwright/test';
import path from 'node:path';

test('happy path: create projects, import students, optimize, edit, export', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Projekte');

  const projectNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'];
  for (const name of projectNames) {
    await page.getByRole('button', { name: /Neues Projekt/i }).click();
    await page.getByLabel('Name').fill(name);
    await page.getByLabel(/Jahrgänge/).fill('7');
    await page.getByLabel('Max-Kapazität').fill('3');
    await page.getByLabel('Soll-Kapazität').fill('2');
    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.getByRole('cell', { name })).toBeVisible();
  }

  await page.getByRole('link', { name: 'Schüler' }).click();
  await page.getByRole('button', { name: 'Excel importieren' }).click();
  await page.locator('input[type="file"]').setInputFiles(
    path.resolve('tests/e2e/fixtures/students.xlsx'),
  );
  // ImportDialog shows: "Gefunden: 3 gültige Schüler-Zeilen"
  await expect(page.getByText(/3 gültige Schüler-Zeilen/)).toBeVisible();
  await page.getByRole('button', { name: /3 importieren/ }).click();
  await expect(page.locator('h1')).toContainText('Schüler (3)');

  await page.getByRole('link', { name: 'Optimierung' }).click();
  await page.getByRole('button', { name: /Verteilung berechnen/ }).click();
  await expect(page).toHaveURL(/\/distribution/);

  // StatsPanel shows: "Verteilt: 3/3"
  await expect(page.getByText(/Verteilt:.*3\/3/)).toBeVisible();

  await page.getByRole('tab', { name: 'Projekte' }).click();
  await expect(page.getByRole('heading', { name: 'Alpha' })).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Excel exportieren/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/wunschplatz-[a-z0-9-]+-\d{4}-\d{2}-\d{2}\.xlsx/);
});

test('persistence: reload preserves projects', async ({ page }) => {
  await page.goto('/projects');
  await page.getByRole('button', { name: /Neues Projekt/i }).click();
  await page.getByLabel('Name').fill('Persist-Test');
  await page.getByLabel(/Jahrgänge/).fill('7');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('cell', { name: 'Persist-Test' })).toBeVisible();
  // wait for the async IndexedDB write to flush before reloading
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByRole('cell', { name: 'Persist-Test' })).toBeVisible();
});
