import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';

const PROJECT_NAMES = ['Schach', 'Yoga', 'Comic', 'Theater', 'Kochen'];

async function setupProjectsAndBlueprint(page: Page) {
  await page.goto('/projects');
  await expect(page.locator('h1')).toContainText('Projekte');
  for (const name of PROJECT_NAMES) {
    await page.getByRole('button', { name: /Neues Projekt/i }).click();
    await page.getByLabel('Name').fill(name);
    await page.getByLabel(/Jahrgänge/).fill('7');
    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.getByRole('cell', { name, exact: true })).toBeVisible();
  }

  await page.getByRole('button', { name: 'Vorlage erstellen' }).click();
  await expect(page.getByText('Formular-Vorlage erstellt')).toBeVisible();
}

test('imports the Google Forms response CSV via the blueprint', async ({ page }) => {
  await setupProjectsAndBlueprint(page);

  await page.getByRole('link', { name: 'Schüler' }).click();
  await page.getByRole('button', { name: 'Formular-Ergebnisse importieren' }).click();
  await page
    .locator('input[type="file"]')
    .setInputFiles(path.resolve('tests/e2e/fixtures/google-responses.csv'));
  await page.getByRole('button', { name: /2 importieren/ }).click();
  await expect(page.locator('h1')).toContainText('Schüler (2)');
});

test('imports the Microsoft Forms response CSV (extra MS columns ignored)', async ({ page }) => {
  await setupProjectsAndBlueprint(page);

  await page.getByRole('link', { name: 'Schüler' }).click();
  await page.getByRole('button', { name: 'Formular-Ergebnisse importieren' }).click();
  await page
    .locator('input[type="file"]')
    .setInputFiles(path.resolve('tests/e2e/fixtures/ms-responses.csv'));
  await page.getByRole('button', { name: /1 importieren/ }).click();
  await expect(page.locator('h1')).toContainText('Schüler (1)');
});
