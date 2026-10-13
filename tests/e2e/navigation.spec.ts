import { test, expect } from '@playwright/test';

test('app pages are preloaded, so switching pages fetches no scripts', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const scripts: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.push(request.url());
  });
  await page
    .getByRole('link', { name: /App starten/ })
    .first()
    .click();
  await expect(page.locator('main h1')).toContainText('Projekte');
  for (const [link, heading] of [
    ['Schüler', 'Schüler'],
    ['Optimierung', 'Optimierung'],
    ['Verteilung', 'Verteilung'],
  ]) {
    await page.getByRole('navigation').getByRole('link', { name: link }).click();
    await expect(page.locator('main h1')).toContainText(heading);
  }

  expect(scripts).toEqual([]);
});

test('the Excel library loads only when a file is imported', async ({ page }) => {
  const xlsx: string[] = [];
  page.on('request', (request) => {
    if (/xlsx/.test(new URL(request.url()).pathname)) xlsx.push(request.url());
  });
  await page.goto('/students');
  await expect(page.locator('main h1')).toContainText('Schüler');
  await page.waitForLoadState('networkidle');
  expect(xlsx).toEqual([]);

  await page.getByRole('button', { name: 'Excel importieren' }).click();
  await page.locator('input[type="file"]').setInputFiles('tests/e2e/fixtures/students.xlsx');
  // The row summary only appears once SheetJS has parsed the file.
  await expect(page.getByText(/gültige Schüler-Zeilen/)).toBeVisible();
  expect(xlsx).not.toEqual([]);
});
