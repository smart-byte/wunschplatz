import { test, expect } from '@playwright/test';
import { deleteRoundByName, readWorkspace } from './workspace';

test('round switch via nav dropdown retains each round’s data', async ({ page }) => {
  await page.goto('/projects');
  await page.getByRole('button', { name: /Neues Projekt/i }).click();
  await page.getByLabel('Name').fill('Runde1-Projekt');
  await page.getByLabel(/Jahrgänge/).fill('7');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('cell', { name: 'Runde1-Projekt', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Wunschrunde auswählen:/ }).click();
  await page.getByRole('menuitem', { name: 'Wunschrunden verwalten…', exact: true }).click();
  await page.getByRole('button', { name: 'Neue Wunschrunde' }).click();
  await expect(page.getByText('Wunschrunde 2 angelegt')).toBeVisible();
  await page.getByRole('link', { name: 'Projekte', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Noch keine Projekte' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Runde1-Projekt', exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: /Wunschrunde 2/ }).click();
  await page.getByRole('menuitem', { name: /Wunschrunde 1/ }).click();
  await expect(page.getByText('Wunschrunde gewechselt')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Runde1-Projekt', exact: true })).toBeVisible();
});

test('phase picker completes and reactivates a round, survives reload', async ({ page }) => {
  await page.goto('/wunschrunden');
  const picker = () => page.getByRole('combobox').first();

  await expect(picker()).toContainText('Laufend');
  await picker().click();
  await page.getByRole('option', { name: 'Abgeschlossen' }).click();
  await expect(picker()).toContainText('Abgeschlossen');

  await expect.poll(async () => (await readWorkspace(page)).rounds[0].phase).toBe('completed');
  await page.reload();
  await expect(picker()).toContainText('Abgeschlossen');

  await picker().click();
  await page.getByRole('option', { name: 'Laufend' }).click();
  await expect(picker()).toContainText('Laufend');
});

test('row menu duplicates and deletes rounds, survives reload', async ({ page }) => {
  await page.goto('/wunschrunden');

  await page.getByTitle('Aktionen').first().click();
  await page.getByRole('menuitem', { name: 'Duplizieren' }).click();
  await expect(page.getByText('Wunschrunde dupliziert')).toBeVisible();
  await expect(page.getByText('Wunschrunde 1 (Kopie)')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Wunschrunde 1 (Kopie)')).toBeVisible();

  // The selected round can be deleted once the word is typed; the copy takes its place.
  await page.getByTitle('Aktionen').first().click();
  await page.getByRole('menuitem', { name: 'Löschen' }).click();
  const dialog = page.getByRole('dialog');
  const confirm = dialog.getByRole('button', { name: 'Löschen', exact: true });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel(/bestätigen/).fill('ja');
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel(/bestätigen/).fill('Bestätigen');
  await confirm.click();
  await expect(page.getByText('Wunschrunde gelöscht')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Wunschrunde 1 (Kopie)', exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Wunschrunde 1', exact: true })).toHaveCount(0);

  // Deleting the last round leaves a new empty one.
  await deleteRoundByName(page, 'Wunschrunde 1 (Kopie)');
  await expect(page.getByRole('button', { name: 'Wunschrunde 1', exact: true })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Wunschrunde 1', exact: true })).toBeDisabled();
  expect((await readWorkspace(page)).rounds.map((round) => round.name)).toEqual(['Wunschrunde 1']);
});

test('clicking a round title selects it', async ({ page }) => {
  await page.goto('/wunschrunden');
  await page.getByRole('button', { name: 'Neue Wunschrunde' }).click();
  await expect(page.getByText('Wunschrunde 2 angelegt')).toBeVisible();

  await page.getByRole('button', { name: 'Wunschrunde 1', exact: true }).click();
  await expect(page.getByText('Wunschrunde gewechselt')).toBeVisible();
  await expect(
    page.getByRole('navigation').getByRole('button', { name: /Wunschrunde 1/ }),
  ).toBeVisible();
});
