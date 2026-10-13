import { test, expect } from '@playwright/test';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { read, utils } from 'xlsx';
import { readWorkspace } from './workspace';

test('happy path: create projects, import students, optimize, edit, export', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  await page.goto('/projects');
  await expect(page.locator('h1')).toContainText('Projekte');

  const projectNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'];
  for (const name of projectNames) {
    await page.getByRole('button', { name: /Neues Projekt/i }).click();
    await page.getByLabel('Name').fill(name);
    await page.getByLabel(/Jahrgänge/).fill('7');
    await page.getByLabel('Max-Kapazität').fill('3');
    await page.getByLabel('Soll-Kapazität').fill('2');
    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.getByRole('cell', { name, exact: true })).toBeVisible();
  }

  await page.getByRole('navigation').getByRole('link', { name: 'Schüler' }).click();
  // Both pages have an "Excel importieren" button; wait until the students page is shown.
  await expect(page.locator('h1')).toContainText('Schüler');
  await page.getByRole('button', { name: 'Excel importieren' }).click();
  await page
    .locator('input[type="file"]')
    .setInputFiles(path.resolve('tests/e2e/fixtures/students.xlsx'));
  await expect(page.getByText(/3 gültige Schüler-Zeilen/)).toBeVisible();
  await page.getByRole('button', { name: /3 importieren/ }).click();
  await expect(page.locator('h1')).toContainText('Schüler (3)');

  await page.getByRole('navigation').getByRole('link', { name: 'Optimierung' }).click();
  await page.getByRole('button', { name: /Verteilung berechnen/ }).click();
  await expect(page).toHaveURL(/\/distribution/);

  await expect(page.getByText(/Verteilt:.*3\/3/)).toBeVisible();

  await page.getByRole('tab', { name: 'Projekte' }).click();
  await expect(page.getByRole('heading', { name: 'Alpha' })).toBeVisible();

  await page.getByRole('tab', { name: 'Tabelle', exact: true }).click();
  const assignment = page.getByRole('combobox', { name: 'Projekt für Anna Müller', exact: true });
  await expect(assignment.locator('option:checked')).toHaveText('Alpha');
  await assignment.selectOption({ label: 'Beta' });
  await expect(assignment.locator('option:checked')).toHaveText('Beta');
  await expect(page.getByRole('row').filter({ hasText: 'Müller, Anna' })).toContainText('2.');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Excel exportieren/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/wunschplatz-[a-z0-9-]+-\d{4}-\d{2}-\d{2}\.xlsx/);
  const workbook = read(await readFile((await download.path())!));
  const rows = utils.sheet_to_json(workbook.Sheets.Verteilung);
  expect(rows).toHaveLength(3);
  expect(rows).toContainEqual(
    expect.objectContaining({
      Vorname: 'Anna',
      Nachname: 'Müller',
      'Zugewiesenes Projekt': 'Beta',
      'Erfüllte Prio': 2,
    }),
  );
  expect(utils.sheet_to_json(workbook.Sheets.Projekte)).toContainEqual(
    expect.objectContaining({
      Projekt: 'Beta',
      Belegung: 2,
    }),
  );
  expect(browserErrors).toEqual([]);
});

test('persistence: reload preserves projects', async ({ page }) => {
  await page.goto('/projects');
  await page.getByRole('button', { name: /Neues Projekt/i }).click();
  await page.getByLabel('Name').fill('Persist-Test');
  await page.getByLabel(/Jahrgänge/).fill('7');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('cell', { name: 'Persist-Test', exact: true })).toBeVisible();
  await expect
    .poll(async () => (await readWorkspace(page)).rounds[0].data.projects)
    .toEqual([expect.objectContaining({ name: 'Persist-Test' })]);
  await page.reload();
  await expect(page.getByRole('cell', { name: 'Persist-Test', exact: true })).toBeVisible();
});
