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
