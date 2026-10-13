import { test, expect, type Page } from '@playwright/test';

async function addProject(page: Page, name: string) {
  await page.getByRole('button', { name: 'Neues Projekt', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill(name);
  await page.getByLabel(/Jahrgänge/).fill('7');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('cell', { name, exact: true })).toBeVisible();
}

test('the actions menu exports and deletes all projects', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto('/projects');
  await addProject(page, 'Töpfern');

  await page.getByRole('button', { name: 'Weitere Aktionen', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: 'Excel exportieren', exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.xlsx$/);

  await page.getByRole('button', { name: 'Weitere Aktionen', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Alle löschen', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Noch keine Projekte', exact: true }),
  ).toBeVisible();
});

test('the next-step link leads from projects to students', async ({ page }) => {
  await page.goto('/projects');
  await addProject(page, 'Schach');
  await page.getByRole('link', { name: 'Weiter zu den Schülern', exact: true }).click();
  await expect(page.locator('main h1')).toContainText('Schüler');
});
