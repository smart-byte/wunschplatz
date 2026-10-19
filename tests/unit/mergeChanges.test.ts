import { describe, expect, it } from 'vitest';
import { mergeChanges } from '@/store/mergeChanges';
import type { Project } from '@/types';

describe('mergeChanges', () => {
  it('keeps a field cleared locally while another tab changed a different field', () => {
    const base: Project = {
      id: 'p1',
      name: 'Schach',
      description: 'Brettspiele',
      grades: [7],
      maxCapacity: 10,
      targetCapacity: 8,
    };
    const remote = { ...base, maxCapacity: 12 };
    const merged = mergeChanges(base, { ...base, description: undefined }, remote);
    expect(merged.conflict).toBe(false);
    // Edit dialogs apply the merge as a patch over the stored record.
    const saved = { ...remote, ...merged.value };
    expect(saved.description).toBeUndefined();
    expect(saved.maxCapacity).toBe(12);
  });
});
