import 'fake-indexeddb/auto';
import { afterEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';

afterEach(() => {
  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    value: new IDBFactory(),
  });
});
