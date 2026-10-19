import { describe, expect, it } from 'vitest';
import { needsAttention, type DistributionRow } from '@/lib/distribution';
import type { Project } from '@/types';

const project: Project = {
  id: 'p',
  name: 'Schach',
  grades: [7],
  maxCapacity: 2,
  targetCapacity: 2,
};

function row(id: string, priorityRank: number | null): DistributionRow {
  return {
    student: { id, firstName: id, lastName: id, className: '7a', grade: 7, priorities: ['p'] },
    assignment: { studentId: id, projectId: 'p', priorityRank, manuallyEdited: false },
    assignedProject: project,
  };
}

describe('needsAttention', () => {
  it('is false when everyone got a wish and the project fits', () => {
    expect(needsAttention(project, [row('a', 1), row('b', 3)])).toBe(false);
  });

  it('flags projects over their maximum capacity', () => {
    expect(needsAttention(project, [row('a', 1), row('b', 1), row('c', 2)])).toBe(true);
  });

  it('flags students placed outside their wishes', () => {
    expect(needsAttention(project, [row('a', 1), row('b', null)])).toBe(true);
  });
});
