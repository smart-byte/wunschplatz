import { test, expect } from '@playwright/test';

test('app pages are preloaded, so switching pages fetches no scripts', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const scripts: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.push(request.url());
  });
  await page.getByRole('link', { name: /App starten/ }).first().click();
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
