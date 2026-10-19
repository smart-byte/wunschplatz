import { beforeEach, describe, expect, it } from 'vitest';
import { staleness } from '@/hooks/useStaleAssignments';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { defaultSolverConfig, type Project, type Student } from '@/types';

const projects: Project[] = [
  { id: 'p1', name: 'Schach', grades: [7], maxCapacity: 10, targetCapacity: 8 },
];
const student = (id: string): Student => ({
  id,
  firstName: id,
  lastName: 'Beispiel',
  className: '7a',
  grade: 7,
  priorities: ['p1'],
});
const active = () => {
  const { distributions, activeId } = useAssignmentsStore.getState();
  return distributions.find((d) => d.id === activeId) ?? null;
};

beforeEach(() => {
  useAssignmentsStore.setState({ distributions: [], activeId: null });
});

describe('staleness', () => {
  it('does not flag the manual distribution a first move creates', () => {
    useAssignmentsStore.getState().updateAssignment('s1', 'p1', 1);
    const students = [student('s1'), student('s2'), student('s3')];
    expect(staleness(active(), students, projects, defaultSolverConfig)).toEqual({
      stale: false,
      reasonKey: null,
    });
  });

  it('does not flag a manual distribution while a deleted student is still listed', () => {
    useAssignmentsStore.getState().updateAssignment('gone', 'p1', 1);
    expect(staleness(active(), [student('s1')], projects, defaultSolverConfig).stale).toBe(false);
  });

  it('flags students added after a solver run', () => {
    useAssignmentsStore
      .getState()
      .createDistribution(
        'Lauf 1',
        [{ studentId: 's1', projectId: 'p1', priorityRank: 1, manuallyEdited: false }],
        {
          kind: 'solver',
          timestamp: 0,
          config: defaultSolverConfig,
          score: 0,
          stats: {
            totalStudents: 1,
            assignedByPriority: [1, 0, 0, 0, 0],
            notInTop5: 0,
            unassigned: 0,
          },
        },
      );
    expect(
      staleness(active(), [student('s1'), student('s2')], projects, defaultSolverConfig).reasonKey,
    ).toBe('distribution.stale.reasons.newStudentsImported');
  });
});
