import { test, expect, type Page } from '@playwright/test';

async function addStudent(page: Page, firstName: string) {
  await page.getByRole('button', { name: 'Neuer Schüler', exact: true }).click();
  await page.getByLabel('Vorname', { exact: true }).fill(firstName);
  await page.getByLabel('Nachname', { exact: true }).fill('Beispiel');
  await page.getByLabel('Klasse', { exact: true }).fill('7a');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('cell', { name: `Beispiel, ${firstName}` })).toBeVisible();
}

test('the step navigation shows progress through the workflow', async ({ page }) => {
  const step = (name: string) =>
    page.getByRole('navigation').getByRole('link', { name, exact: true });
  await page.goto('/projects');
  await expect(step('Projekte')).toHaveAttribute('data-state', 'open');

  await page.getByRole('button', { name: 'Neues Projekt', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Schach');
  await page.getByLabel(/Jahrgänge/).fill('7');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(step('Projekte')).toHaveAttribute('data-state', 'done');
  await expect(step('Projekte')).toHaveAccessibleDescription('erledigt');
  await expect(step('Schüler')).toHaveAttribute('data-state', 'open');
  await expect(step('Schüler')).toHaveAccessibleDescription('noch offen');

  await step('Schüler').click();
  await addStudent(page, 'Anna');
  await expect(step('Schüler')).toHaveAttribute('data-state', 'done');
  await expect(step('Verteilung')).toHaveAttribute('data-state', 'open');

  await step('Optimierung').click();
  await page.getByRole('button', { name: 'Verteilung berechnen' }).click();
  await expect(page).toHaveURL(/\/distribution/);
  await expect(step('Optimierung')).toHaveAttribute('data-state', 'done');
  await expect(step('Verteilung')).toHaveAttribute('data-state', 'done');

  // A new student makes the computed distribution outdated.
  await step('Schüler').click();
  await addStudent(page, 'Ben');
  await expect(step('Verteilung')).toHaveAttribute('data-state', 'attention');
  await expect(step('Verteilung')).toHaveAccessibleDescription(/veraltet/);
});

test('the navigation is already visible while the workspace loads', async ({ page }) => {
  // An IndexedDB open request that never settles keeps the app in its loading state.
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', { value: { open: () => ({}) } });
  });
  await page.goto('/students');
  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'Projekte', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Lädt');
});

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
