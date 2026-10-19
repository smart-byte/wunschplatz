import { expect, it, vi } from 'vitest';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useRoundsStore } from '@/store/useRoundsStore';
import { useSessionStore } from '@/store/session';
import { createRound, switchRound } from '@/store/roundsTransaction';
import { createRoundsBootstrap } from '@/store/bootstrapRounds';
import { createWorkspaceStorage } from '@/store/persist';
import { flushWorkspace } from '@/store/workspaceSync';

it('keeps all previously saved rounds intact and blocks further edits after a failed save', async () => {
  await createRoundsBootstrap()();
  const aId = useRoundsStore.getState().activeRoundId!;
  useProjectsStore
    .getState()
    .addProject({ name: 'Saved A', grades: [7], maxCapacity: 10, targetCapacity: 8 });
  await createRound('B', '2026-09-05');
  const bId = useRoundsStore.getState().activeRoundId!;
  const storage = createWorkspaceStorage();
  const before = await storage.read();
  // A persistent failure: one-off errors are retried and never reach the user.
  const put = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => {
    throw new Error('Disk full');
  });
  useProjectsStore
    .getState()
    .addProject({ name: 'Unsaved B', grades: [7], maxCapacity: 10, targetCapacity: 8 });
  await expect(switchRound(aId)).rejects.toThrow('Disk full');
  put.mockRestore();
  expect(useSessionStore.getState()).toMatchObject({ phase: 'error', error: 'storage' });
  expect(useRoundsStore.getState().activeRoundId).toBe(bId);
  expect(await storage.read()).toEqual(before);
  await expect(flushWorkspace()).rejects.toThrow('Disk full');
  expect(() => useProjectsStore.getState().setProjects([])).toThrow(/Wait/);
  // The blocked edit is explained instead of failing silently.
  expect(useSessionStore.getState().notice).toEqual({ key: 'saveBlocked' });
});
