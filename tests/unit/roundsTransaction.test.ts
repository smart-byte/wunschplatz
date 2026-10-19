import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { useSolverConfigStore } from '@/store/useSolverConfigStore';
import { useRoundsStore } from '@/store/useRoundsStore';
import { switchRound, createRound } from '@/store/roundsTransaction';
import { defaultSolverConfig, type Project, type Round } from '@/types';

const proj = (id: string): Project => ({
  id,
  name: id,
  grades: [7],
  maxCapacity: 10,
  targetCapacity: 8,
});

beforeEach(() => {
  useProjectsStore.setState({ projects: [] });
  useStudentsStore.setState({ students: [], groupColors: {} });
  useAssignmentsStore.setState({ distributions: [], activeId: null });
  useSolverConfigStore.setState({ config: defaultSolverConfig });
  useRoundsStore.setState({ rounds: [], activeRoundId: null });
});

function seedActive(id = 'r1'): void {
  const r: Round = { id, name: 'Wunschrunde 1', createdAt: '2026-06-02', status: 'active' };
  useRoundsStore.setState({ rounds: [r], activeRoundId: id });
}

describe('createRound', () => {
  it('empty: snapshots the current round, activates a fresh empty round', async () => {
    seedActive();
    useProjectsStore.setState({ projects: [proj('p1')] });

    await createRound('Wunschrunde 2', '2026-06-02');

    const s = useRoundsStore.getState();
    expect(s.rounds).toHaveLength(2);
    const active = s.rounds.find((r) => r.id === s.activeRoundId)!;
    expect(active.name).toBe('Wunschrunde 2');
    expect(active.status).toBe('active');
    expect(active.data).toBeUndefined();
    expect(useProjectsStore.getState().projects).toEqual([]);

    const old = s.rounds.find((r) => r.id === 'r1')!;
    expect(old.status).toBe('idle');
    expect(old.data?.projects).toEqual([proj('p1')]);
  });

  it('new rounds start in phase "planned"', async () => {
    seedActive();
    await createRound('Wunschrunde 2', '2026-06-02');
    const s = useRoundsStore.getState();
    expect(s.rounds.find((r) => r.id === s.activeRoundId)!.phase).toBe('planned');
  });
});

describe('switchRound', () => {
  it('round-trips A→B→A preserving both rounds', async () => {
    seedActive('A');
    useProjectsStore.setState({ projects: [proj('pa')] });
    await createRound('B', '2026-06-02');
    const bId = useRoundsStore.getState().activeRoundId!;
    useProjectsStore.setState({ projects: [proj('pb')] });

    await switchRound('A');
    expect(useProjectsStore.getState().projects.map((p) => p.id)).toEqual(['pa']);

    await switchRound(bId);
    expect(useProjectsStore.getState().projects.map((p) => p.id)).toEqual(['pb']);
  });

  it('is a no-op when target is already active', async () => {
    seedActive('A');
    await switchRound('A');
    expect(useRoundsStore.getState().activeRoundId).toBe('A');
  });

  it('throws when switching to an idle round with no data', async () => {
    const a: Round = { id: 'A', name: 'A', createdAt: 'x', status: 'active' };
    const b: Round = { id: 'B', name: 'B', createdAt: 'x', status: 'idle' };
    useRoundsStore.setState({ rounds: [a, b], activeRoundId: 'A' });
    await expect(switchRound('B')).rejects.toThrow(/no data/i);
  });

  it('serializes concurrent calls (no interleave / double snapshot)', async () => {
    seedActive('A');
    useProjectsStore.setState({ projects: [proj('pa')] });
    await createRound('B', '2026-06-02');
    const bId = useRoundsStore.getState().activeRoundId!;
    const p1 = switchRound('A');
    const p2 = switchRound(bId);
    await Promise.all([p1, p2]);
    expect(useRoundsStore.getState().activeRoundId).toBe(bId);
  });
});
