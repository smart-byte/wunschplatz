import { expect, test, type Page } from '@playwright/test';
import { deleteRoundByName } from './workspace';

async function draftProject(page: Page, name: string) {
  await page.getByRole('button', { name: 'Neues Projekt', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill(name);
  await page.getByLabel(/Jahrgänge/).fill('7');
}

const save = (page: Page) => page.getByRole('button', { name: 'Speichern', exact: true }).click();
const cell = (page: Page, name: string) =>
  page.getByRole('cell', { name, exact: true, includeHidden: true });

test('tabs open together, retain simultaneous additions, and stay editable after another tab closes', async ({
  page,
  context,
}) => {
  await context.addInitScript(() =>
    Object.defineProperty(navigator, 'locks', { value: undefined }),
  );
  const second = await context.newPage();
  await Promise.all([page.goto('/projects'), second.goto('/projects')]);
  await Promise.all([draftProject(page, 'Keramik'), draftProject(second, 'Theater')]);
  await Promise.all([save(page), save(second)]);
  for (const tab of [page, second]) {
    await expect(cell(tab, 'Keramik')).toBeVisible();
    await expect(cell(tab, 'Theater')).toBeVisible();
    await expect(tab.getByRole('heading', { name: 'Projekte (2)', exact: true })).toBeVisible();
  }
  await page.close();
  await draftProject(second, 'Robotik');
  await save(second);
  const third = await context.newPage();
  await third.goto('/projects');
  await expect(cell(third, 'Robotik')).toBeVisible();
  await second.reload();
  await expect(second.getByRole('heading', { name: 'Projekte (3)', exact: true })).toBeVisible();
});

test('each tab keeps its selected round across edits and reloads', async ({ page, context }) => {
  await page.goto('/projects');
  await draftProject(page, 'Runde eins');
  await save(page);
  const second = await context.newPage();
  await second.goto('/projects');
  await expect(cell(second, 'Runde eins')).toBeVisible();
  await page.goto('/wunschrunden');
  await page.getByRole('button', { name: 'Neue Wunschrunde', exact: true }).click();
  await expect(page.getByText('Wunschrunde 2 angelegt')).toBeVisible();
  await page.goto('/projects');
  await Promise.all([draftProject(page, 'Runde zwei'), draftProject(second, 'Noch eins')]);
  await Promise.all([save(page), save(second)]);
  await expect(cell(page, 'Runde eins')).toHaveCount(0);
  await expect(cell(second, 'Runde zwei')).toHaveCount(0);
  await page
    .getByRole('navigation')
    .getByRole('button', { name: /Wunschrunde 2/ })
    .click();
  await page.getByRole('menuitem', { name: /Wunschrunde 1/ }).click();
  await expect(cell(page, 'Noch eins')).toBeVisible();
  await page
    .getByRole('navigation')
    .getByRole('button', { name: /Wunschrunde 1/ })
    .click();
  await page.getByRole('menuitem', { name: /Wunschrunde 2/ }).click();
  await Promise.all([page.reload(), second.reload()]);
  await expect(cell(page, 'Runde zwei')).toBeVisible();
  await expect(cell(second, 'Noch eins')).toBeVisible();
  await expect(cell(second, 'Runde eins')).toBeVisible();
});

test('open project drafts preserve remote changes and require review for conflicting fields', async ({
  page,
  context,
}) => {
  await page.goto('/projects');
  await draftProject(page, 'Keramik');
  await save(page);
  const second = await context.newPage();
  await second.goto('/projects');
  for (const tab of [page, second])
    await tab.getByRole('button', { name: 'Keramik bearbeiten', exact: true }).click();
  await page.getByLabel('Beschreibung (optional)', { exact: true }).fill('Neue Beschreibung');
  await second.getByLabel('Max-Kapazität', { exact: true }).fill('30');
  await save(page);
  await expect(cell(second, 'Neue Beschreibung')).toBeVisible();
  await save(second);
  await expect(cell(page, '30')).toBeVisible();
  await expect(cell(page, 'Neue Beschreibung')).toBeVisible();
  for (const tab of [page, second])
    await tab.getByRole('button', { name: 'Keramik bearbeiten', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Keramik A');
  await second.getByLabel('Name', { exact: true }).fill('Keramik B');
  await save(page);
  await expect(cell(second, 'Keramik A')).toBeVisible();
  await save(second);
  await expect(second.getByRole('dialog').getByRole('alert')).toContainText('anderen Tab');
  await expect(second.getByLabel('Name', { exact: true })).toHaveValue('Keramik B');
  await save(second);
  await expect(cell(page, 'Keramik B')).toBeVisible();
});

test('an open student draft survives remote updates and merges different fields', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/students');
  await page.getByRole('button', { name: 'Neuer Schüler', exact: true }).click();
  await page.getByLabel('Vorname', { exact: true }).fill('Anna');
  await page.getByLabel('Nachname', { exact: true }).fill('Beispiel');
  await page.getByLabel('Klasse', { exact: true }).fill('7a');
  await save(page);
  const second = await context.newPage();
  await second.setViewportSize({ width: 1440, height: 900 });
  await second.goto('/students');
  for (const tab of [page, second])
    await tab.getByRole('button', { name: 'Anna Beispiel bearbeiten', exact: true }).click();
  await page.getByLabel('Vorname', { exact: true }).fill('Anne');
  await second.getByLabel('Klasse', { exact: true }).fill('7b');
  await save(page);
  await expect(
    second.getByRole('button', {
      name: 'Anne Beispiel bearbeiten',
      exact: true,
      includeHidden: true,
    }),
  ).toBeAttached();
  await expect(second.getByLabel('Klasse', { exact: true })).toHaveValue('7b');
  await save(second);
  await expect(cell(page, '7b')).toBeVisible();
  await expect(cell(page, 'Beispiel, Anne')).toBeVisible();
});

test('deleting a round in another tab selects a surviving round without restoring deleted data', async ({
  page,
  context,
}) => {
  await page.goto('/wunschrunden');
  const second = await context.newPage();
  await second.goto('/projects');
  await expect(
    second.getByRole('heading', { name: 'Noch keine Projekte', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Neue Wunschrunde', exact: true }).click();
  await expect(page.getByText('Wunschrunde 2 angelegt')).toBeVisible();
  await deleteRoundByName(page, 'Wunschrunde 1');
  await expect(
    second.getByRole('navigation').getByRole('button', { name: /Wunschrunde 2/ }),
  ).toBeVisible();
  await expect(second.getByText(/in einem anderen Tab gelöscht/)).toBeVisible();
  await draftProject(second, 'Bleibt erhalten');
  await save(second);
  await page.goto('/projects');
  await expect(cell(page, 'Bleibt erhalten')).toBeVisible();
});

test('tabs synchronize using storage events when BroadcastChannel is unavailable', async ({
  page,
  context,
}) => {
  await context.addInitScript(() =>
    Object.defineProperty(window, 'BroadcastChannel', { value: undefined }),
  );
  await page.goto('/projects');
  const second = await context.newPage();
  await second.goto('/projects');
  await draftProject(page, 'Ohne BroadcastChannel');
  await save(page);
  await expect(cell(second, 'Ohne BroadcastChannel')).toBeVisible();
});

test('a tab catches up on focus after missing change notifications', async ({ page, context }) => {
  await context.addInitScript(() =>
    Object.defineProperty(window, 'BroadcastChannel', {
      value: class {
        postMessage() {}
        close() {}
      },
    }),
  );
  await page.goto('/projects');
  const second = await context.newPage();
  await second.goto('/projects');
  await second.bringToFront();
  await page.bringToFront();
  await draftProject(page, 'Nach Pause sichtbar');
  await save(page);
  await page.getByRole('navigation').getByRole('link', { name: 'Optimierung' }).click();
  // Playwright emulates focus in every page, so tab activation alone emits no focus event.
  await second.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(cell(second, 'Nach Pause sichtbar')).toBeVisible();
});
