import { expect, it, vi } from 'vitest';
import { createWorkspaceStorage, type SavedRound, type Workspace } from '@/store/persist';
import { createWorkspaceSync } from '@/store/workspaceSync';
import { emptyRoundData } from '@/store/workspaceState';
import type { Project } from '@/types';

const project = (id: string): Project => ({
  id,
  name: id,
  grades: [7],
  targetCapacity: 8,
  maxCapacity: 10,
});
const seed = (): Workspace => ({
  version: 1,
  revision: 0,
  rounds: [
    {
      id: 'r',
      name: 'Round',
      createdAt: 'x',
      data: { ...emptyRoundData(), projects: [project('original')] },
    },
  ],
});

function client(initial: Workspace, storage = createWorkspaceStorage()) {
  let rounds = structuredClone(initial.rounds);
  const conflict = vi.fn();
  const error = vi.fn();
  const sync = createWorkspaceSync(initial, storage, {
    capture: () => rounds,
    apply: (next) => {
      rounds = next;
    },
    onCommit: vi.fn(),
    onConflict: conflict,
    onError: error,
  });
  return {
    ...sync,
    conflict,
    error,
    read: () => rounds,
    edit: (update: (rounds: SavedRound[]) => void) => {
      rounds = structuredClone(rounds);
      update(rounds);
      sync.save();
    },
  };
}

async function pair() {
  const storage = createWorkspaceStorage();
  const initial = await storage.transact(seed);
  return { storage, a: client(initial), b: client(initial) };
}

it('preserves simultaneous additions from stale tabs and synchronizes both views', async () => {
  const { storage, a, b } = await pair();
  a.edit((rounds) => rounds[0].data.projects.push(project('a')));
  b.edit((rounds) => rounds[0].data.projects.push(project('b')));
  await Promise.all([a.flush(), b.flush()]);
  a.refresh();
  b.refresh();
  await Promise.all([a.flush(), b.flush()]);
  expect(a.read()).toEqual(b.read());
  expect((await storage.read())!.rounds[0].data.projects.map((p) => p.id).sort()).toEqual([
    'a',
    'b',
    'original',
  ]);
  expect(a.conflict).not.toHaveBeenCalled();
  expect(b.conflict).not.toHaveBeenCalled();
});

it('merges changes to different fields of the same project', async () => {
  const { storage, a, b } = await pair();
  a.edit((r) => {
    r[0].data.projects[0].name = 'Renamed';
  });
  b.edit((r) => {
    r[0].data.projects[0].maxCapacity = 20;
  });
  await Promise.all([a.flush(), b.flush()]);
  expect((await storage.read())!.rounds[0].data.projects[0]).toMatchObject({
    name: 'Renamed',
    maxCapacity: 20,
  });
  expect(b.conflict).not.toHaveBeenCalled();
});

it('reports concurrent edits to the same field and keeps the last committed value', async () => {
  const { storage, a, b } = await pair();
  a.edit((r) => {
    r[0].name = 'First';
  });
  await a.flush();
  b.edit((r) => {
    r[0].name = 'Second';
  });
  await b.flush();
  expect((await storage.read())!.rounds[0].name).toBe('Second');
  expect(b.conflict).toHaveBeenCalled();
});

for (const deleteFirst of [true, false]) {
  it(`does not resurrect a deleted project when a stale tab edits it (delete first: ${deleteFirst})`, async () => {
    const { storage, a, b } = await pair();
    const remove = async () => {
      a.edit((r) => {
        r[0].data.projects = [];
      });
      await a.flush();
    };
    const edit = async () => {
      b.edit((r) => {
        r[0].data.projects[0].name = 'Stale';
      });
      await b.flush();
    };
    if (deleteFirst) {
      await remove();
      await edit();
    } else {
      await edit();
      await remove();
    }
    expect((await storage.read())!.rounds[0].data.projects).toEqual([]);
  });
}

it('rebases edits made while an earlier save is still in flight', async () => {
  const storage = createWorkspaceStorage();
  const initial = await storage.transact(seed);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = vi.fn();
  const a = client(initial, {
    ...storage,
    transact: async (change) => {
      started();
      await gate;
      return storage.transact(change);
    },
  });
  a.edit((r) => {
    r[0].data.projects[0].name = 'First edit';
  });
  await vi.waitFor(() => expect(started).toHaveBeenCalled());
  a.edit((r) => {
    r[0].data.projects[0].description = 'Second edit';
  });
  release();
  await a.flush();
  expect((await storage.read())!.rounds[0].data.projects[0]).toMatchObject({
    name: 'First edit',
    description: 'Second edit',
  });
  expect(a.hasUnsavedChanges()).toBe(false);
});

it('keeps a storage failure sticky and does not silently claim later edits were saved', async () => {
  const storage = createWorkspaceStorage();
  const initial = await storage.transact(seed);
  const a = client(initial, {
    ...storage,
    transact: async () => {
      throw new Error('Disk full');
    },
  });
  a.edit((r) => {
    r[0].name = 'Unsaved';
  });
  await expect(a.flush()).rejects.toThrow('Disk full');
  a.edit((r) => {
    r[0].name = 'Also unsaved';
  });
  await expect(a.flush()).rejects.toThrow('Disk full');
  expect(a.hasUnsavedChanges()).toBe(true);
  expect(a.error).toHaveBeenCalledOnce();
  expect((await storage.read())!.rounds[0].name).toBe('Round');
});

it('retains edits in different rounds without sharing the selected round', async () => {
  const storage = createWorkspaceStorage();
  const initial = seed();
  initial.rounds.push({ ...initial.rounds[0], id: 'second', data: emptyRoundData() });
  await storage.transact(() => initial);
  const a = client(initial);
  const b = client(initial);
  a.edit((r) => r[0].data.projects.push(project('a')));
  b.edit((r) => r[1].data.projects.push(project('b')));
  await Promise.all([a.flush(), b.flush()]);
  const saved = (await storage.read())!.rounds;
  expect(saved[0].data.projects.map((p) => p.id)).toEqual(['original', 'a']);
  expect(saved[1].data.projects.map((p) => p.id)).toEqual(['b']);
});
