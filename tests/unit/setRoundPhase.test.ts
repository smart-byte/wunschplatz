import { describe, it, expect, beforeEach } from 'vitest';
import { useRoundsStore } from '@/store/useRoundsStore';
import { setRoundPhase } from '@/store/roundsTransaction';
import type { Round } from '@/types';

beforeEach(() => {
  const a: Round = { id: 'r1', name: 'W1', createdAt: 'x', status: 'active' };
  const b: Round = { id: 'r2', name: 'W2', createdAt: 'x', status: 'idle' };
  useRoundsStore.setState({ rounds: [a, b], activeRoundId: 'r1' });
});

describe('setRoundPhase', () => {
  it('sets the phase on the targeted round only', () => {
    setRoundPhase('r2', 'completed');
    const s = useRoundsStore.getState();
    expect(s.rounds.find((r) => r.id === 'r2')!.phase).toBe('completed');
    expect(s.rounds.find((r) => r.id === 'r1')!.phase).toBeUndefined();
  });

  it('overwrites an existing phase (reactivate)', () => {
    setRoundPhase('r2', 'completed');
    setRoundPhase('r2', 'running');
    expect(useRoundsStore.getState().rounds.find((r) => r.id === 'r2')!.phase).toBe('running');
  });
});
