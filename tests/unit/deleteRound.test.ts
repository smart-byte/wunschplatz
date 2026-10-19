import { describe, it, expect, beforeEach } from 'vitest';
import { useRoundsStore } from '@/store/useRoundsStore';
import { deleteRound } from '@/store/roundsTransaction';
import { emptyRoundData } from '@/store/workspaceState';
import type { Round } from '@/types';

beforeEach(() => {
  const a: Round = { id: 'A', name: 'A', createdAt: 'x', status: 'active' };
  const b: Round = { id: 'B', name: 'B', createdAt: 'x', status: 'idle', data: emptyRoundData() };
  useRoundsStore.setState({ rounds: [a, b], activeRoundId: 'A' });
});

describe('deleteRound', () => {
  it('removes an idle round', async () => {
    await deleteRound('B');
    expect(useRoundsStore.getState().rounds.map((r) => r.id)).toEqual(['A']);
  });

  it('throws for the active round and leaves it in place', async () => {
    await expect(deleteRound('A')).rejects.toThrow(/active/i);
    expect(useRoundsStore.getState().rounds).toHaveLength(2);
  });

  it('throws for an unknown id', async () => {
    await expect(deleteRound('nope')).rejects.toThrow(/not found/i);
  });
});
