import { expect, it } from 'vitest';
import { createStore, get, set } from 'idb-keyval';
import { readLegacyWorkspace } from '@/store/legacyWorkspace';
import { emptyRoundData } from '@/store/workspaceState';
import { PALETTE_KEYS } from '@/lib/groups';

async function seed(key: string, state: unknown, version = 0) {
  await set(key, JSON.stringify({ state, version }), createStore(`wunschplatz-${key}`, key));
}

it('recovers a staged legacy round switch without overwriting either round or modifying legacy storage', async () => {
  const data = (id: string) => ({
    ...emptyRoundData(),
    projects: [{ id, name: id, grades: [7], maxCapacity: 10, targetCapacity: 8 }],
  });
  await seed('projects', { projects: data('a').projects });
  await seed('rounds', {
    activeRoundId: 'B',
    rounds: [
      { id: 'A', name: 'A', createdAt: 'x', status: 'idle', data: data('a') },
      { id: 'B', name: 'B', createdAt: 'x', status: 'active', data: data('b') },
    ],
  });
  const migrated = await readLegacyWorkspace('x', 'Default');
  expect(migrated.activeRoundId).toBe('B');
  expect(migrated.workspace.rounds.map((r) => r.data.projects[0].id)).toEqual(['a', 'b']);
  const original = await get<string>('projects', createStore('wunschplatz-projects', 'projects'));
  expect(JSON.parse(original!).state.projects[0].id).toBe('a');
});

it('migrates legacy group palette indices and the old single-distribution format', async () => {
  await seed(
    'students',
    { students: [], groupColors: { old: 1, negative: -1, custom: '#abcdef' } },
    1,
  );
  await seed(
    'assignments',
    {
      assignments: [{ studentId: 's', projectId: 'p', priorityRank: 1, manuallyEdited: false }],
      lastRun: {
        timestamp: 123,
        config: emptyRoundData().solverConfig,
        score: 7,
        stats: {
          totalStudents: 1,
          assignedByPriority: [1, 0, 0, 0, 0],
          notInTop5: 0,
          unassigned: 0,
        },
      },
    },
    1,
  );
  const { workspace } = await readLegacyWorkspace('x', 'Default');
  const data = workspace.rounds[0].data;
  expect(data.groupColors).toEqual({
    old: PALETTE_KEYS[1],
    negative: PALETTE_KEYS.at(-1),
    custom: '#abcdef',
  });
  expect(data.distributions).toHaveLength(1);
  expect(data.distributionActiveId).toBe(data.distributions[0].id);
  expect(data.distributions[0].assignments[0].studentId).toBe('s');
});

it('rejects a missing active legacy round rather than silently resetting data', async () => {
  await seed('rounds', {
    activeRoundId: 'missing',
    rounds: [{ id: 'A', status: 'idle', data: emptyRoundData() }],
  });
  await expect(readLegacyWorkspace('x', 'Default')).rejects.toThrow('active round is missing');
});
