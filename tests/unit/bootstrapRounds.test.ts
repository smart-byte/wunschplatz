import { createStore, set } from 'idb-keyval';
import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useRoundsStore } from '@/store/useRoundsStore';
import { createRoundsBootstrap } from '@/store/bootstrapRounds';
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

  it('seed round starts in phase "running"', async () => {
    await ensureRoundsReady('2026-06-02');
    expect(useRoundsStore.getState().rounds[0].phase).toBe('running');
  });
});
