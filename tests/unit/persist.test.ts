import { describe, it, expect, beforeEach, vi } from 'vitest';

const store = new Map<string, unknown>();

vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => store.get(key)),
  set: vi.fn(async (key: string, val: unknown) => { store.set(key, val); }),
  del: vi.fn(async (key: string) => { store.delete(key); }),
  createStore: vi.fn(() => ({})),
}));

import { createIdbStorage } from '@/store/persist';

describe('createIdbStorage', () => {
  beforeEach(() => { store.clear(); });

  it('returns null for missing key', async () => {
    const storage = createIdbStorage('test');
    expect(await storage.getItem('missing')).toBeNull();
  });

  it('returns JSON string after setItem', async () => {
    const storage = createIdbStorage('test');
    await storage.setItem('foo', JSON.stringify({ a: 1 }));
    expect(await storage.getItem('foo')).toBe(JSON.stringify({ a: 1 }));
  });

  it('removeItem deletes key', async () => {
    const storage = createIdbStorage('test');
    await storage.setItem('foo', 'bar');
    await storage.removeItem('foo');
    expect(await storage.getItem('foo')).toBeNull();
  });
});
