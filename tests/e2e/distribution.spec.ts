import { test, expect } from '@playwright/test';

test('the distribution table loads long lists in pages', async ({ page }) => {
  await page.goto('/projects');
  await page.getByRole('button', { name: 'Beispieldaten', exact: true }).click();
  await page.getByLabel('Anzahl Projekte').fill('5');
  await page.getByLabel('Anzahl Schüler').fill('230');
  await page.getByRole('button', { name: 'Generieren', exact: true }).click();
  await page.getByRole('navigation').getByRole('link', { name: 'Optimierung' }).click();
  await page.getByRole('button', { name: 'Verteilung berechnen' }).click();
  await expect(page).toHaveURL(/\/distribution/);
  await page.getByRole('tab', { name: 'Tabelle', exact: true }).click();

  const rows = page.getByRole('tabpanel').locator('tbody tr');
  await expect(rows).toHaveCount(100);
  await page.getByRole('button', { name: 'Weitere 100 anzeigen', exact: true }).click();
  await expect(rows).toHaveCount(200);

  const name = (await rows.first().getByRole('button').first().innerText()).trim();
  const [last, first] = name.split(', ');
  await page.getByRole('searchbox', { name: 'Schüler suchen' }).fill(`${first} ${last}`);
  await expect(rows.first()).toContainText(name);
  for (const row of await rows.all()) await expect(row).toContainText(last);
});
