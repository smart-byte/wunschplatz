import { describe, it, expect, beforeEach } from 'vitest';
import { commitImportedStudents } from '@/store/commitImportedStudents';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import type { Student } from '@/types';

beforeEach(() => {
  useStudentsStore.setState({ students: [], groupColors: {} });
  useAssignmentsStore.setState({
    distributions: [
      {
        id: 'd',
        name: 'x',
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
      },
    ],
    activeId: 'd',
  });
});

describe('commitImportedStudents', () => {
  it('replaces students, clears assignments, and assigns group colors', () => {
    const students: Omit<Student, 'id'>[] = [
      { firstName: 'A', lastName: 'B', className: '7a', grade: 7, priorities: [], groupId: 'g1' },
      { firstName: 'C', lastName: 'D', className: '7a', grade: 7, priorities: [], groupId: 'g1' },
    ];
    const { count, groupCount } = commitImportedStudents(students);
    expect(count).toBe(2);
    expect(groupCount).toBe(1);
    expect(useStudentsStore.getState().students).toHaveLength(2);
    expect(Object.keys(useStudentsStore.getState().groupColors)).toEqual(['g1']);
    expect(useAssignmentsStore.getState().distributions).toEqual([]);
  });
});
