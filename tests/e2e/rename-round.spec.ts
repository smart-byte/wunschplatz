import { expect, test, type Page } from '@playwright/test';
import { readWorkspace } from './workspace';

const roundButton = (page: Page, name: string) =>
  page.getByRole('button', { name, exact: true, includeHidden: true });

async function openRename(page: Page, name: string) {
  await page
    .getByRole('listitem')
    .filter({ has: roundButton(page, name) })
    .getByTitle('Aktionen')
    .click();
  await page.getByRole('menuitem', { name: 'Umbenennen', exact: true }).click();
  return page.getByRole('dialog', { name: 'Wunschrunde umbenennen', exact: true });
}

test('renaming active and inactive rounds preserves their data and selection across reloads', async ({
  page,
}) => {
  await page.goto('/projects');
  await page.getByRole('button', { name: 'Neues Projekt', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Keramik');
  await page.getByLabel(/Jahrgänge/).fill('7');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Keramik', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Wunschrunde auswählen:/ }).click();
  await page.getByRole('menuitem', { name: 'Wunschrunden verwalten…', exact: true }).click();
  const dialog = await openRename(page, 'Wunschrunde 1');
  const name = dialog.getByLabel('Name', { exact: true });
  await expect(name).toBeFocused();
  await name.fill('   ');
  await name.press('Enter');
  await expect(dialog.getByRole('alert')).toContainText('Bitte gib einen Namen');
  await name.fill('  Projektwoche 2026  ');
  await name.press('Enter');
  await expect(dialog).toBeHidden();
  await expect(roundButton(page, 'Projektwoche 2026')).toBeDisabled();
  await page.reload();
  await expect(roundButton(page, 'Projektwoche 2026')).toBeDisabled();

  await page.getByRole('button', { name: 'Neue Wunschrunde', exact: true }).click();
  await expect(page.getByText('Wunschrunde 2 angelegt')).toBeVisible();
  const before = await readWorkspace(page);
  const inactive = await openRename(page, 'Projektwoche 2026');
  await inactive.getByLabel('Name', { exact: true }).fill('Archiv');
  await inactive.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(inactive).toBeHidden();
  await expect(roundButton(page, 'Wunschrunde 2')).toBeDisabled();
  const after = await readWorkspace(page);
  expect(after.rounds).toEqual(
    before.rounds.map((round) =>
      round.name === 'Projektwoche 2026' ? { ...round, name: 'Archiv' } : round,
    ),
  );

  const cancelled = await openRename(page, 'Archiv');
  await cancelled.getByLabel('Name', { exact: true }).fill('Verwerfen');
  await cancelled.press('Escape');
  await expect(cancelled).toBeHidden();
  await page.reload();
  await expect(roundButton(page, 'Wunschrunde 2')).toBeDisabled();
  await roundButton(page, 'Archiv').click();
  await page.getByRole('link', { name: 'Projekte', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Keramik', exact: true })).toBeVisible();
});

test('open rename drafts require review after remote renames and cannot restore deleted rounds', async ({
  page,
  context,
}) => {
  await page.goto('/wunschrunden');
  const second = await context.newPage();
  await second.goto('/wunschrunden');
  const local = await openRename(page, 'Wunschrunde 1');
  const remote = await openRename(second, 'Wunschrunde 1');
  await local.getByLabel('Name', { exact: true }).fill('Mein Entwurf');
  await remote.getByLabel('Name', { exact: true }).fill('Neuer Name');
  await remote.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(roundButton(page, 'Neuer Name')).toBeAttached();
  await local.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(local.getByRole('alert')).toContainText('Neuer Name');
  await expect(local.getByLabel('Name', { exact: true })).toHaveValue('Mein Entwurf');
  await expect(roundButton(second, 'Neuer Name')).toBeVisible();
  await local.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(local).toBeHidden();
  await expect(roundButton(second, 'Mein Entwurf')).toBeVisible();

  await second.getByRole('button', { name: 'Neue Wunschrunde', exact: true }).click();
  await expect(second.getByText('Wunschrunde 2 angelegt')).toBeVisible();
  await roundButton(page, 'Wunschrunde 2').click();
  await expect(roundButton(page, 'Wunschrunde 2')).toBeDisabled();
  const stale = await openRename(page, 'Mein Entwurf');
  await stale.getByLabel('Name', { exact: true }).fill('Nicht wiederherstellen');
  second.once('dialog', (dialog) => dialog.accept());
  await second
    .getByRole('listitem')
    .filter({ has: roundButton(second, 'Mein Entwurf') })
    .getByTitle('Aktionen')
    .click();
  await second.getByRole('menuitem', { name: 'Löschen', exact: true }).click();
  await expect(roundButton(page, 'Mein Entwurf')).toHaveCount(0);
  await stale.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(stale.getByRole('alert')).toContainText('gelöscht');
  await stale.getByRole('button', { name: 'Abbrechen', exact: true }).click();
  await page.reload();
  await expect(roundButton(page, 'Wunschrunde 2')).toBeDisabled();
  expect((await readWorkspace(page)).rounds.map((round) => round.name)).toEqual(['Wunschrunde 2']);
});
