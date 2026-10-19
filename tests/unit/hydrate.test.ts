import { describe, it, expect, beforeEach } from 'vitest';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import type { Student, Distribution } from '@/types';

const student = (id: string, groupId?: string): Student => ({
  id,
  firstName: 'A',
  lastName: 'B',
  className: '7a',
  grade: 7,
  priorities: [],
  groupId,
});

beforeEach(() => {
  useStudentsStore.setState({ students: [], groupColors: {} });
  useAssignmentsStore.setState({ distributions: [], activeId: null });
});

describe('useStudentsStore.hydrate', () => {
  it('replaces students AND keeps the given groupColors verbatim (no pruning)', () => {
    // Snapshot restoration preserves colors even for groups absent from the student list.
    useStudentsStore.getState().hydrate([student('s1', 'g1')], { g1: 'rose', g_old: 'blue' });
    const st = useStudentsStore.getState();
    expect(st.students.map((s) => s.id)).toEqual(['s1']);
    expect(st.groupColors).toEqual({ g1: 'rose', g_old: 'blue' });
  });
});

describe('useAssignmentsStore.hydrate', () => {
  it('replaces distributions and activeId verbatim', () => {
    const d: Distribution = {
      id: 'd1',
      name: 'L1',
      createdAt: 1,
      updatedAt: 1,
      assignments: [],
      run: {
        timestamp: 1,
        config: {
          priorityWeights: [10, 6, 3, 2, 1],
          unmatchedPenalty: 1000,
          overTargetPenalty: 2,
          notInTop5Penalty: 50,
          groupCohesionBonus: 8,
        },
        score: 0,
        stats: {
          totalStudents: 0,
          assignedByPriority: [0, 0, 0, 0, 0],
          notInTop5: 0,
          unassigned: 0,
        },
      },
    };
    useAssignmentsStore.getState().hydrate([d], 'd1');
    const st = useAssignmentsStore.getState();
    expect(st.distributions).toEqual([d]);
    expect(st.activeId).toBe('d1');
  });
});
