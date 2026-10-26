import { describe, it, expect, beforeEach } from 'vitest';
import { useRoundsStore } from '@/store/useRoundsStore';
import { useProjectsStore } from '@/store/useProjectsStore';
import { deleteRound } from '@/store/roundsTransaction';
import { emptyRoundData } from '@/store/workspaceState';
import type { Round } from '@/types';

beforeEach(() => {
  const a: Round = { id: 'A', name: 'A', createdAt: 'x', status: 'active' };
  const b: Round = { id: 'B', name: 'B', createdAt: 'x', status: 'idle', data: emptyRoundData() };
  useRoundsStore.setState({ rounds: [a, b], activeRoundId: 'A' });
  useProjectsStore.setState({
    projects: [{ id: 'p', name: 'P', grades: [7], maxCapacity: 10, targetCapacity: 8 }],
  });
});

describe('deleteRound', () => {
  it('removes an idle round', async () => {
    await deleteRound('B', 'New', 'y');
    expect(useRoundsStore.getState().rounds.map((r) => r.id)).toEqual(['A']);
    expect(useProjectsStore.getState().projects).toHaveLength(1);
  });

  it('deletes the active round and opens the next one with its data', async () => {
    await deleteRound('A', 'New', 'y');
    expect(useRoundsStore.getState().rounds.map((r) => r.id)).toEqual(['B']);
    expect(useRoundsStore.getState().activeRoundId).toBe('B');
    expect(useProjectsStore.getState().projects).toEqual([]);
  });

  it('replaces the last round with a new empty one', async () => {
    await deleteRound('B', 'New', 'y');
    await deleteRound('A', 'New', 'y');
    const { rounds, activeRoundId } = useRoundsStore.getState();
    expect(rounds).toEqual([
      expect.objectContaining({ id: activeRoundId, name: 'New', createdAt: 'y', phase: 'planned' }),
    ]);
    expect(useProjectsStore.getState().projects).toEqual([]);
  });

  it('throws for an unknown id', async () => {
    await expect(deleteRound('nope', 'New', 'y')).rejects.toThrow(/not found/i);
  });
});
