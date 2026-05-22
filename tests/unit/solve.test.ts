import { describe, it, expect } from 'vitest';
import { solveAssignments } from '@/solver/solve';
import { defaultSolverConfig } from '@/types';
import type { Project, Student } from '@/types';

describe('solveAssignments', () => {
  it('assigns everyone to their prio1 when there is plenty of room', () => {
    const projects: Project[] = [
      { id: 'a', name: 'A', grades: [7], maxCapacity: 5, targetCapacity: 3 },
      { id: 'b', name: 'B', grades: [7], maxCapacity: 5, targetCapacity: 3 },
    ];
    const students: Student[] = [
      { id: 's1', firstName: 'A', lastName: 'X', className: '7a', grade: 7, priorities: ['a', 'b'] },
      { id: 's2', firstName: 'B', lastName: 'X', className: '7a', grade: 7, priorities: ['b', 'a'] },
    ];
    const { assignments, stats } = solveAssignments(students, projects, defaultSolverConfig);
    expect(assignments.find((a) => a.studentId === 's1')?.projectId).toBe('a');
    expect(assignments.find((a) => a.studentId === 's1')?.priorityRank).toBe(1);
    expect(assignments.find((a) => a.studentId === 's2')?.projectId).toBe('b');
    expect(stats.assignedByPriority[0]).toBe(2);
    expect(stats.unassigned).toBe(0);
  });

  it('marks priorityRank correctly for prio2 fallback', () => {
    const projects: Project[] = [
      { id: 'a', name: 'A', grades: [7], maxCapacity: 1, targetCapacity: 1 },
      { id: 'b', name: 'B', grades: [7], maxCapacity: 5, targetCapacity: 3 },
    ];
    const students: Student[] = [
      { id: 's1', firstName: 'A', lastName: 'X', className: '7a', grade: 7, priorities: ['a', 'b'] },
      { id: 's2', firstName: 'B', lastName: 'X', className: '7a', grade: 7, priorities: ['a', 'b'] },
    ];
    const { assignments } = solveAssignments(students, projects, defaultSolverConfig);
    const ranks = assignments.map((a) => a.priorityRank).sort();
    expect(ranks).toEqual([1, 2]);
  });

  it('marks priorityRank null for not-in-top5 placement', () => {
    const projects: Project[] = [
      { id: 'a', name: 'A', grades: [7], maxCapacity: 0, targetCapacity: 0 },
      { id: 'b', name: 'B', grades: [7], maxCapacity: 5, targetCapacity: 3 },
    ];
    const students: Student[] = [
      { id: 's1', firstName: 'A', lastName: 'X', className: '7a', grade: 7, priorities: ['a'] },
    ];
    const { assignments, stats } = solveAssignments(students, projects, defaultSolverConfig);
    expect(assignments[0].projectId).toBe('b');
    expect(assignments[0].priorityRank).toBeNull();
    expect(stats.notInTop5).toBe(1);
  });
});

describe('solveAssignments with groups', () => {
  it('keeps group together on shared prio1', () => {
    const projects: Project[] = [
      { id: 'a', name: 'A', grades: [7], maxCapacity: 5, targetCapacity: 4 },
      { id: 'b', name: 'B', grades: [7], maxCapacity: 5, targetCapacity: 4 },
    ];
    const students: Student[] = [
      { id: 's1', firstName: 'A', lastName: 'X', className: '7a', grade: 7, priorities: ['a', 'b'], groupId: 'g1' },
      { id: 's2', firstName: 'B', lastName: 'X', className: '7a', grade: 7, priorities: ['a', 'b'], groupId: 'g1' },
      { id: 's3', firstName: 'C', lastName: 'X', className: '7a', grade: 7, priorities: ['a', 'b'], groupId: 'g1' },
    ];
    const { assignments } = solveAssignments(students, projects, defaultSolverConfig);
    const projectsAssigned = new Set(assignments.map((a) => a.projectId));
    expect(projectsAssigned.size).toBe(1); // all in one project
    expect(assignments.every((a) => a.priorityRank === 1)).toBe(true);
  });

  it('group falls back to prio2 if prio1 cannot fit whole group', () => {
    const projects: Project[] = [
      { id: 'a', name: 'A', grades: [7], maxCapacity: 1, targetCapacity: 1 },
      { id: 'b', name: 'B', grades: [7], maxCapacity: 5, targetCapacity: 4 },
    ];
    const students: Student[] = [
      { id: 's1', firstName: 'A', lastName: 'X', className: '7a', grade: 7, priorities: ['a', 'b'], groupId: 'g1' },
      { id: 's2', firstName: 'B', lastName: 'X', className: '7a', grade: 7, priorities: ['a', 'b'], groupId: 'g1' },
    ];
    const { assignments } = solveAssignments(students, projects, defaultSolverConfig);
    expect(assignments.every((a) => a.projectId === 'b')).toBe(true);
    expect(assignments.every((a) => a.priorityRank === 2)).toBe(true);
  });
});
