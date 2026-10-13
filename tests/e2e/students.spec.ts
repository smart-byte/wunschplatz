import { test, expect, type Page } from '@playwright/test';

async function addStudent(page: Page, firstName: string, wish?: string) {
  await page.getByRole('button', { name: 'Neuer Schüler', exact: true }).click();
  await page.getByLabel('Vorname', { exact: true }).fill(firstName);
  await page.getByLabel('Nachname', { exact: true }).fill('Beispiel');
  await page.getByLabel('Klasse', { exact: true }).fill('7a');
  if (wish) {
    await page.getByRole('combobox', { name: 'Prio 1', exact: true }).click();
    await page.getByRole('option', { name: wish, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(
    page.getByRole('cell', { name: `Beispiel, ${firstName}`, exact: true }),
  ).toBeVisible();
}

test('long student lists load in pages and can be searched', async ({ page }) => {
  await page.goto('/projects');
  await page.getByRole('button', { name: 'Beispieldaten', exact: true }).click();
  await page.getByLabel('Anzahl Projekte').fill('5');
  await page.getByLabel('Anzahl Schüler').fill('230');
  await page.getByRole('button', { name: 'Generieren', exact: true }).click();
  await page.getByRole('navigation').getByRole('link', { name: 'Schüler' }).click();
  await expect(page.locator('main h1')).toContainText('Schüler (230)');

  const rows = page.getByRole('main').locator('tbody tr');
  await expect(rows).toHaveCount(100);
  await page.getByRole('button', { name: 'Weitere 100 anzeigen', exact: true }).click();
  await expect(rows).toHaveCount(200);
  await page.getByRole('button', { name: 'Weitere 30 anzeigen', exact: true }).click();
  await expect(rows).toHaveCount(230);

  const name = (await rows.first().getByRole('cell').nth(1).innerText()).trim();
  const [last, first] = name.split(', ');
  await page.getByRole('searchbox', { name: 'Schüler suchen' }).fill(`${first} ${last}`);
  await expect(rows.first()).toContainText(name);
  for (const row of await rows.all()) await expect(row).toContainText(last);
});

test('the filter shows students without wishes', async ({ page }) => {
  await page.goto('/projects');
  await page.getByRole('button', { name: 'Neues Projekt', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Schach');
  await page.getByLabel(/Jahrgänge/).fill('7');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await page.getByRole('navigation').getByRole('link', { name: 'Schüler' }).click();
  await addStudent(page, 'Mia', 'Schach');
  await addStudent(page, 'Noah');

  await page.getByRole('combobox', { name: 'Schüler filtern', exact: true }).click();
  await page.getByRole('option', { name: 'Ohne Wünsche', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Beispiel, Noah', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Beispiel, Mia', exact: true })).toHaveCount(0);
});

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
