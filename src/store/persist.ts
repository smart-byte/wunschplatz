import { createStore, get, set, del } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

export function createIdbStorage(dbName: string): StateStorage {
  const customStore = createStore(`projektverteilung-${dbName}`, dbName);

  return {
    getItem: async (name) => {
      const value = await get<string>(name, customStore);
      return value ?? null;
    },
    setItem: async (name, value) => {
      await set(name, value, customStore);
    },
    removeItem: async (name) => {
      await del(name, customStore);
    },
  };
}
