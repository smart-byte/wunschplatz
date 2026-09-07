import { describe, expect, it } from 'vitest';
import { createWorkspaceStorage, type Workspace } from '@/store/persist';
import { emptyRoundData } from '@/store/workspaceState';

const workspace = (): Workspace => ({
  version: 1,
  revision: 0,
  rounds: [{ id: 'r', name: 'R', createdAt: 'x', data: emptyRoundData() }],
});

describe('atomic workspace storage', () => {
  it('returns undefined for a new installation', async () => {
    expect(await createWorkspaceStorage().read()).toBeUndefined();
  });

  it('initializes once when two tabs start together', async () => {
    const a = createWorkspaceStorage();
    const b = createWorkspaceStorage();
    const values = await Promise.all([
      a.transact((current) => current ?? workspace()),
      b.transact(
        (current) =>
          current ?? { ...workspace(), rounds: [{ ...workspace().rounds[0], id: 'other' }] },
      ),
    ]);
    expect(values[0]).toEqual(values[1]);
    expect((await a.read())?.rounds).toHaveLength(1);
  });

  it('serializes concurrent read-modify-write transactions', async () => {
    const a = createWorkspaceStorage();
    const b = createWorkspaceStorage();
    await a.transact(workspace);
    await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        (i % 2 ? a : b).transact((current) => ({ ...current!, revision: current!.revision + 1 })),
      ),
    );
    expect((await a.read())?.revision).toBe(12);
  });

  it('leaves the previous complete document intact when a transaction fails', async () => {
    const storage = createWorkspaceStorage();
    const saved = await storage.transact(workspace);
    await expect(
      storage.transact(() => {
        throw new Error('Failed');
      }),
    ).rejects.toThrow('Failed');
    expect(await storage.read()).toEqual(saved);
  });
});
