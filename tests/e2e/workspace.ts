import type { Page } from '@playwright/test';
import type { Workspace } from '../../src/store/persist';

export function readWorkspace(page: Page): Promise<Workspace> {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open('wunschplatz-workspace');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const transaction = db.transaction('workspace', 'readonly');
          const request = transaction.objectStore('workspace').get('workspace');
          transaction.oncomplete = () => {
            db.close();
            resolve(request.result);
          };
          transaction.onabort = () => {
            db.close();
            reject(transaction.error);
          };
        };
      }),
  );
}

/** Deletes a round from the rounds page through its typed confirmation. */
export async function deleteRoundByName(page: Page, name: string): Promise<void> {
  await page
    .getByRole('listitem')
    .filter({ has: page.getByRole('button', { name, exact: true }) })
    .getByTitle('Aktionen')
    .click();
  await page.getByRole('menuitem', { name: 'Löschen', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(/bestätigen/).fill('bestätigen');
  await dialog.getByRole('button', { name: 'Löschen', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
}
