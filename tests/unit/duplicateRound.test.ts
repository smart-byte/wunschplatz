import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { useSolverConfigStore } from '@/store/useSolverConfigStore';
import { useRoundsStore } from '@/store/useRoundsStore';
import { duplicateRound } from '@/store/roundsTransaction';
import { emptyRoundData } from '@/store/workspaceState';
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

describe('duplicateRound', () => {
  it('duplicates the active round from the live working stores without switching', async () => {
    const a: Round = {
      id: 'A',
      name: 'Runde A',
      createdAt: 'x',
      status: 'active',
      phase: 'running',
    };
    useRoundsStore.setState({ rounds: [a], activeRoundId: 'A' });
    useProjectsStore.setState({ projects: [proj('p1')] });

    await duplicateRound('A', '2026-08-08');

    const s = useRoundsStore.getState();
    expect(s.activeRoundId).toBe('A');
    expect(s.rounds).toHaveLength(2);
    const copy = s.rounds[1];
    expect(copy.id).not.toBe('A');
    expect(copy).toMatchObject({
      name: 'Runde A (Kopie)',
      status: 'idle',
      phase: 'planned',
      createdAt: '2026-08-08',
    });
    expect(copy.data?.projects).toEqual([proj('p1')]);
  });

  it('deep-copies an idle round: mutating the original does not affect the copy', async () => {
    const data = { ...emptyRoundData(), projects: [proj('p1')] };
    const a: Round = { id: 'A', name: 'A', createdAt: 'x', status: 'active' };
    const b: Round = { id: 'B', name: 'B', createdAt: 'x', status: 'idle', data };
    useRoundsStore.setState({ rounds: [a, b], activeRoundId: 'A' });

    await duplicateRound('B', '2026-08-08');

    data.projects[0].name = 'mutated';
    const copy = useRoundsStore.getState().rounds[2];
    expect(copy.name).toBe('B (Kopie)');
    expect(copy.data?.projects[0].name).toBe('p1');
  });

  it('throws for an unknown id and for an idle round without data', async () => {
    const a: Round = { id: 'A', name: 'A', createdAt: 'x', status: 'active' };
    const b: Round = { id: 'B', name: 'B', createdAt: 'x', status: 'idle' };
    useRoundsStore.setState({ rounds: [a, b], activeRoundId: 'A' });
    await expect(duplicateRound('nope', 'x')).rejects.toThrow(/not found/i);
    await expect(duplicateRound('B', 'x')).rejects.toThrow(/no data/i);
  });
});
