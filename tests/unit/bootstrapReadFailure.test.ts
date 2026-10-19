import { it, expect } from 'vitest';
import { createStore, set } from 'idb-keyval';
import { createRoundsBootstrap } from '@/store/bootstrapRounds';
import { useSessionStore } from '@/store/session';
import { useRoundsStore } from '@/store/useRoundsStore';

it('reports corrupt persisted JSON instead of waiting forever or creating an empty round', async () => {
  await set('projects', '{invalid JSON', createStore('wunschplatz-projects', 'projects'));
  await expect(createRoundsBootstrap()()).rejects.toThrow();
  expect(useSessionStore.getState()).toMatchObject({ phase: 'error', error: 'storage' });
  expect(useRoundsStore.getState().rounds).toEqual([]);
});
