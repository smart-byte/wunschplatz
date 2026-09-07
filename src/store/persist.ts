import { createStore, get } from 'idb-keyval';
import type { Round, RoundData } from '@/types';

export type SavedRound = Omit<Round, 'status' | 'data'> & { data: RoundData };
export type Workspace = { version: 1; revision: number; rounds: SavedRound[] };

export function createWorkspaceStorage() {
  const storage = createStore('wunschplatz-workspace', 'workspace');
  return {
    read: () => get<Workspace>('workspace', storage),
    transact: (change: (current: Workspace | undefined) => Workspace): Promise<Workspace> =>
      storage(
        'readwrite',
        (store) =>
          new Promise<Workspace>((resolve, reject) => {
            let result: Workspace;
            const transaction = store.transaction;
            transaction.oncomplete = () => resolve(result);
            transaction.onabort = transaction.onerror = () =>
              reject(transaction.error ?? new Error('Could not save rounds'));
            const request = store.get('workspace');
            request.onsuccess = () => {
              try {
                result = change(request.result as Workspace | undefined);
                store.put(result, 'workspace');
              } catch (error) {
                transaction.abort();
                reject(error);
              }
            };
          }),
      ),
  };
}

export function validateWorkspace(value: Workspace): Workspace {
  if (value.version !== 1 || !Number.isInteger(value.revision) || !value.rounds?.length) {
    throw new Error('The saved rounds are invalid or from a newer version');
  }
  const ids = new Set<string>();
  for (const round of value.rounds) {
    if (
      !round.id ||
      ids.has(round.id) ||
      !round.data ||
      !Array.isArray(round.data.projects) ||
      !Array.isArray(round.data.students) ||
      !Array.isArray(round.data.distributions)
    ) {
      throw new Error('The saved round data is incomplete');
    }
    ids.add(round.id);
  }
  return value;
}
