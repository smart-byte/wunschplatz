import { describe, it, expect, beforeEach } from 'vitest';
import { useRoundsStore } from '@/store/useRoundsStore';
import { setActiveRoundBlueprint } from '@/store/roundsTransaction';
import { buildBlueprint } from '@/forms/buildBlueprint';
import type { Project, Round } from '@/types';

const projects: Project[] = Array.from({ length: 5 }, (_, i) => ({
  id: `p${i}`,
  name: `Projekt ${i}`,
  grades: [7],
  maxCapacity: 10,
  targetCapacity: 8,
}));

beforeEach(() => {
  const r: Round = { id: 'r1', name: 'Wunschrunde 1', createdAt: 'x', status: 'active' };
  useRoundsStore.setState({ rounds: [r], activeRoundId: 'r1' });
});

describe('setActiveRoundBlueprint', () => {
  it('stores the blueprint on the active round only', () => {
    const built = buildBlueprint(projects, '2026-06-02');
    if (!built.ok) throw new Error();
    setActiveRoundBlueprint(built.blueprint);
    const active = useRoundsStore.getState().rounds.find((r) => r.id === 'r1')!;
    expect(active.blueprint?.priorities).toHaveLength(5);
  });
});
