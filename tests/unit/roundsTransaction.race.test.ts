import { beforeEach, expect, it, vi } from 'vitest';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useRoundsStore } from '@/store/useRoundsStore';
import { useSessionStore } from '@/store/session';
import { createRound, switchRound } from '@/store/roundsTransaction';
import { createRoundsBootstrap } from '@/store/bootstrapRounds';
import { createWorkspaceStorage } from '@/store/persist';

const writes = vi.hoisted(() => ({ paused: false, gates: [] as (() => void)[] }));
vi.mock('@/store/persist', async (original) => {
  const real = await original<typeof import('@/store/persist')>();
  return {
    ...real,
    createWorkspaceStorage: () => {
      const storage = real.createWorkspaceStorage();
      return {
        ...storage,
        transact: async (change: Parameters<typeof storage.transact>[0]) => {
          const saved = storage.transact(change);
          if (writes.paused) await new Promise<void>((resolve) => writes.gates.push(resolve));
          return saved;
        },
      };
    },
  };
});

beforeEach(() => {
  writes.paused = false;
  writes.gates = [];
});

it('drains pending edits before switching and guards both data and metadata during the switch', async () => {
  await createRoundsBootstrap()();
  const aId = useRoundsStore.getState().activeRoundId!;
  await createRound('B', '2026-09-05');
  const bId = useRoundsStore.getState().activeRoundId!;
  writes.paused = true;
  useProjectsStore
    .getState()
    .addProject({ name: 'Late B edit', grades: [7], maxCapacity: 10, targetCapacity: 8 });
  const swap = switchRound(aId);
  await vi.waitFor(() => expect(writes.gates).toHaveLength(1));
  expect(useSessionStore.getState().phase).toBe('switching');
  expect(useRoundsStore.getState().activeRoundId).toBe(bId);
  expect(() => useProjectsStore.getState().setProjects([])).toThrow(/Wait/);
  expect(() => useRoundsStore.setState({ rounds: [] })).toThrow(/Wait/);
  writes.paused = false;
  writes.gates.splice(0).forEach((release) => release());
  await swap;
  expect(useProjectsStore.getState().projects).toEqual([]);
  expect(useRoundsStore.getState().activeRoundId).toBe(aId);
  const saved = await createWorkspaceStorage().read();
  expect(saved!.rounds.find((r) => r.id === bId)!.data.projects[0].name).toBe('Late B edit');
  expect(saved!.rounds.find((r) => r.id === aId)!.data.projects).toEqual([]);
});
