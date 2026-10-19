import { createStore, set } from 'idb-keyval';
import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useRoundsStore } from '@/store/useRoundsStore';
import { createRoundsBootstrap } from '@/store/bootstrapRounds';
import { createRound } from '@/store/roundsTransaction';
import { flushWorkspace, stopWorkspaceSync } from '@/store/workspaceSync';
import { createWorkspaceStorage } from '@/store/persist';
import type { Project } from '@/types';

let ensureRoundsReady = createRoundsBootstrap();

const proj = (id: string): Project => ({
  id,
  name: id,
  grades: [7],
  maxCapacity: 10,
  targetCapacity: 8,
});

beforeEach(() => {
  ensureRoundsReady = createRoundsBootstrap();
  useProjectsStore.setState({ projects: [] });
  useStudentsStore.setState({ students: [], groupColors: {} });
  useRoundsStore.setState({ rounds: [], activeRoundId: null });
});

describe('ensureRoundsReady', () => {
  it('seeds exactly one active "Wunschrunde 1" wrapping existing data', async () => {
    await set(
      'projects',
      JSON.stringify({ state: { projects: [proj('p1')] } }),
      createStore('wunschplatz-projects', 'projects'),
    );
    await ensureRoundsReady('2026-06-02');
    const s = useRoundsStore.getState();
    expect(s.rounds).toHaveLength(1);
    expect(s.rounds[0]).toMatchObject({ name: 'Wunschrunde 1', status: 'active' });
    expect(s.rounds[0].data).toBeUndefined();
    expect(useProjectsStore.getState().projects).toEqual([proj('p1')]);
    expect(s.activeRoundId).toBe(s.rounds[0].id);
  });

  it('always seeds an active round even when the working set is empty', async () => {
    await ensureRoundsReady('2026-06-02');
    expect(useRoundsStore.getState().rounds).toHaveLength(1);
    expect(useRoundsStore.getState().activeRoundId).not.toBeNull();
  });

  it('does not create a second round if one already exists', async () => {
    await set(
      'rounds',
      JSON.stringify({
        state: {
          rounds: [{ id: 'r9', name: 'Keep', createdAt: 'x', status: 'active' }],
          activeRoundId: 'r9',
        },
      }),
      createStore('wunschplatz-rounds', 'rounds'),
    );
    await ensureRoundsReady('2026-06-02');
    expect(useRoundsStore.getState().rounds.map((r) => r.id)).toEqual(['r9']);
  });

  it('is one-shot: concurrent calls share a single promise and seed once', async () => {
    await set(
      'projects',
      JSON.stringify({ state: { projects: [proj('p1')] } }),
      createStore('wunschplatz-projects', 'projects'),
    );
    const [a, b] = [ensureRoundsReady('2026-06-02'), ensureRoundsReady('2026-06-02')];
    expect(a).toBe(b);
    await Promise.all([a, b]);
    expect(useRoundsStore.getState().rounds).toHaveLength(1);
  });

  it('reopens the round used last when a new browser session starts', async () => {
    localStorage.clear();
    await ensureRoundsReady('2026-06-02');
    await createRound('Wunschrunde 2', '2026-06-02');
    await flushWorkspace();
    const second = useRoundsStore.getState().activeRoundId;
    // A new session has neither this tab's selection nor the in-memory stores.
    stopWorkspaceSync();
    sessionStorage.clear();
    useRoundsStore.setState({ rounds: [], activeRoundId: null });
    await createRoundsBootstrap()('2026-06-02');
    expect(useRoundsStore.getState().activeRoundId).toBe(second);
  });

  it('leaves the shared last-used round alone when another tab saves a change', async () => {
    localStorage.clear();
    await ensureRoundsReady('2026-06-02');
    localStorage.setItem('wunschplatz-active-round', 'round-of-another-tab');
    await createWorkspaceStorage().transact((saved) => ({
      ...saved!,
      revision: saved!.revision + 1,
      rounds: saved!.rounds.map((round) => ({ ...round, name: 'Umbenannt' })),
    }));
    window.dispatchEvent(new Event('focus'));
    await flushWorkspace();
    expect(useRoundsStore.getState().rounds[0].name).toBe('Umbenannt');
    expect(localStorage.getItem('wunschplatz-active-round')).toBe('round-of-another-tab');
  });

  it('seed round starts in phase "running"', async () => {
    await ensureRoundsReady('2026-06-02');
    expect(useRoundsStore.getState().rounds[0].phase).toBe('running');
  });
});
