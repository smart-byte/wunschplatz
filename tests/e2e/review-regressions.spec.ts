import { test, expect, type Page } from '@playwright/test';

async function addProject(page: Page, name: string) {
  await page.getByRole('button', { name: 'Neues Projekt', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill(name);
  await page.getByLabel(/Jahrgänge/).fill('5-7');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('cell', { name, exact: true })).toBeVisible();
}

test('storage read failures leave a visible retry screen', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', {
      value: {
        open() {
          throw new Error('Storage denied');
        },
      },
    });
  });
  await page.goto('/projects');
  await expect(
    page.getByRole('heading', { name: 'Speichern oder Laden fehlgeschlagen' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Erneut laden' })).toBeVisible();
});

test('UTF-8 forms import preserves names and rejects bad wishes without replacing students', async ({
  page,
}) => {
  await page.goto('/projects');
  await addProject(page, 'Töpfern');
  await addProject(page, 'Schach');
  await page.getByRole('button', { name: 'Vorlage erstellen', exact: true }).click();
  await page.getByRole('navigation').getByRole('link', { name: 'Schüler' }).click();
  await page.getByRole('button', { name: 'Formular-Ergebnisse importieren' }).click();
  const csv = 'Vorname,Nachname,Klasse,Jahrgang,1. Wahl,2. Wahl\nAnna,Müller,7a,7,Töpfern,Schach';
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'responses.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await page.getByRole('button', { name: '1 importieren', exact: true }).click();
  await expect(page.getByRole('cell', { name: /Müller/ }).first()).toBeVisible();
  // With students present, one import button opens the dialog on the forms tab.
  await page.getByRole('button', { name: 'Importieren', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles({
    name: 'invalid.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv.replace('Töpfern,Schach', 'Unknown,Schach')),
  });
  await expect(page.getByRole('alert')).toContainText('Bitte korrigiere');
  await expect(page.getByRole('button', { name: 'Importieren', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Abbrechen', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Schüler (1)', exact: true })).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Verteilung' }).click();
  await expect(page.getByText(/Verteilt.*0\/1/)).toBeVisible();
  await page.getByRole('tab', { name: 'Tabelle', exact: true }).click();
  await page.getByRole('combobox', { name: 'Verteilung filtern', exact: true }).click();
  await page.getByRole('option', { name: 'Nur unverteilt', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Müller, Anna', exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Verteilung filtern', exact: true }).click();
  await page.getByRole('option', { name: 'Nicht in Top5', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Müller, Anna', exact: true })).toHaveCount(0);
});

for (const language of ['de', 'en']) {
  test(`mobile navigation and import dialog remain reachable (${language})`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.addInitScript((lang) => localStorage.setItem('wunschplatz-lang', lang), language);
    await page.goto('/wunschrunden');
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    const switcher = page
      .getByRole('navigation')
      .getByRole('button', { name: /Wunschrunde auswählen|Select round/ });
    await expect(switcher).toBeInViewport();
    const round = page.getByRole('main').getByRole('listitem').first();
    const name = round.locator('button').first();
    await expect(name).toBeInViewport();
    expect(await name.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    for (const link of await page.getByRole('navigation').getByRole('link').all()) {
      await link.focus();
      await expect(link).toBeInViewport();
    }
    await page.goto('/projects');
    await page.getByRole('button', { name: /Excel importieren|Import Excel/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
    expect(box!.y + box!.height).toBeLessThanOrEqual(667);
    expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.getByRole('button', { name: /Abbrechen|Cancel/, exact: true }).click();
    await expect(dialog).toHaveCount(0);
  });
}

test('optimizer sliders have accessible names', async ({ page }) => {
  await page.goto('/optimize');
  const sliders = page.getByRole('slider');
  await expect(sliders).toHaveCount(6);
  for (const slider of await sliders.all()) await expect(slider).toHaveAccessibleName(/.+/);
});
