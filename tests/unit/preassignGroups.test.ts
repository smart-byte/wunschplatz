import { describe, it, expect } from 'vitest';
import { preassignGroups } from '@/solver/preassignGroups';
import { defaultSolverConfig } from '@/types';
import type { Project, Student } from '@/types';

const project = (id: string, grades: number[], max: number, target = max - 2): Project => ({
  id, name: `P-${id}`, grades, maxCapacity: max, targetCapacity: target,
});

const student = (id: string, grade: number, priorities: string[], groupId?: string): Student => ({
  id, firstName: `S${id}`, lastName: 'X', className: '7a', grade, priorities, groupId,
});

describe('preassignGroups', () => {
  it('returns no preassignments when no groups exist', () => {
    const projects = [project('a', [7], 10)];
    const students = [student('s1', 7, ['a'])];
    const result = preassignGroups(students, projects, defaultSolverConfig);
    expect(result.preassignments.size).toBe(0);
    expect(result.remainingStudents).toEqual(students);
    expect(result.consumedCapacity.size).toBe(0);
  });

  it('assigns 2-member group to shared prio1 when project has room', () => {
    const projects = [project('a', [7], 10), project('b', [7], 10)];
    const students = [
      student('s1', 7, ['a', 'b'], 'g1'),
      student('s2', 7, ['a', 'b'], 'g1'),
    ];
    const result = preassignGroups(students, projects, defaultSolverConfig);
    expect(result.preassignments.get('s1')).toEqual({ projectId: 'a', priorityRank: 1 });
    expect(result.preassignments.get('s2')).toEqual({ projectId: 'a', priorityRank: 1 });
    expect(result.consumedCapacity.get('a')).toBe(2);
    expect(result.remainingStudents).toHaveLength(0);
  });

  it('falls back to prio2 if prio1 cannot fit whole group', () => {
    const projects = [project('a', [7], 1), project('b', [7], 10)];
    const students = [
      student('s1', 7, ['a', 'b'], 'g1'),
      student('s2', 7, ['a', 'b'], 'g1'),
    ];
    const result = preassignGroups(students, projects, defaultSolverConfig);
    expect(result.preassignments.get('s1')?.projectId).toBe('b');
    expect(result.preassignments.get('s1')?.priorityRank).toBe(2);
    expect(result.consumedCapacity.get('b')).toBe(2);
  });

  it('leaves group in remainingStudents when no priority fits whole group', () => {
    const projects = [project('a', [7], 1), project('b', [7], 1)];
    const students = [
      student('s1', 7, ['a', 'b'], 'g1'),
      student('s2', 7, ['a', 'b'], 'g1'),
    ];
    const result = preassignGroups(students, projects, defaultSolverConfig);
    expect(result.preassignments.size).toBe(0);
    expect(result.remainingStudents).toHaveLength(2);
  });

  it('processes larger groups before smaller ones (capacity contention)', () => {
    // Project a has 3 slots. Group of 3 should win over later group of 2.
    const projects = [project('a', [7], 3)];
    const students = [
      student('s1', 7, ['a'], 'g1'),
      student('s2', 7, ['a'], 'g1'),
      student('s3', 7, ['a'], 'g2'),
      student('s4', 7, ['a'], 'g2'),
      student('s5', 7, ['a'], 'g2'),
    ];
    const result = preassignGroups(students, projects, defaultSolverConfig);
    // g2 (3 members) should be preferred to fill the 3-slot project
    expect(result.consumedCapacity.get('a')).toBe(3);
    expect(result.preassignments.get('s3')?.projectId).toBe('a');
    expect(result.preassignments.get('s4')?.projectId).toBe('a');
    expect(result.preassignments.get('s5')?.projectId).toBe('a');
    // g1 not preassigned — goes to remaining
    expect(result.preassignments.has('s1')).toBe(false);
    expect(result.remainingStudents.map((s) => s.id).sort()).toEqual(['s1', 's2']);
  });

  it('respects grade compatibility', () => {
    const projects = [project('a', [5], 10), project('b', [7], 10)];
    const students = [
      student('s1', 7, ['a', 'b'], 'g1'),
      student('s2', 7, ['a', 'b'], 'g1'),
    ];
    const result = preassignGroups(students, projects, defaultSolverConfig);
    // a is grade 5 only, group is grade 7 → must use b
    expect(result.preassignments.get('s1')?.projectId).toBe('b');
  });

  it('singletons are not preassigned (singleton group has no co-assignment benefit)', () => {
    const projects = [project('a', [7], 10)];
    const students = [student('s1', 7, ['a'])]; // no groupId
    const result = preassignGroups(students, projects, defaultSolverConfig);
    expect(result.preassignments.size).toBe(0);
    expect(result.remainingStudents).toEqual(students);
  });

  it('group with mixed grades only fits projects accepting all members grades', () => {
    // p1 accepts only grade 6; p2 accepts grades 6+7
    const projects = [project('p1', [6], 10), project('p2', [6, 7], 10)];
    const students = [
      student('s1', 6, ['p1', 'p2'], 'g1'),
      student('s2', 7, ['p1', 'p2'], 'g1'),
    ];
    const result = preassignGroups(students, projects, defaultSolverConfig);
    // p1 only takes grade 6, so s2 (grade 7) blocks it. Must use p2.
    expect(result.preassignments.get('s1')?.projectId).toBe('p2');
    expect(result.preassignments.get('s2')?.projectId).toBe('p2');
    expect(result.preassignments.get('s1')?.priorityRank).toBe(2);
  });

  it('mixed-grade group falls back to remaining when no project covers all grades', () => {
    const projects = [project('p1', [6], 10), project('p2', [7], 10)];
    const students = [
      student('s1', 6, ['p1', 'p2'], 'g1'),
      student('s2', 7, ['p1', 'p2'], 'g1'),
    ];
    const result = preassignGroups(students, projects, defaultSolverConfig);
    expect(result.preassignments.size).toBe(0);
    expect(result.remainingStudents).toHaveLength(2);
  });

  it('splits a 4-member group into 2+2 when no single project fits all four', () => {
    // a and b both have cap 2 — whole group cannot fit either.
    const projects = [project('a', [7], 2), project('b', [7], 2)];
    const students = [
      student('s1', 7, ['a', 'b'], 'g1'),
      student('s2', 7, ['a', 'b'], 'g1'),
      student('s3', 7, ['a', 'b'], 'g1'),
      student('s4', 7, ['a', 'b'], 'g1'),
    ];
    const result = preassignGroups(students, projects, defaultSolverConfig);
    expect(result.consumedCapacity.get('a')).toBe(2);
    expect(result.consumedCapacity.get('b')).toBe(2);
    expect(result.preassignments.size).toBe(4);
  });

  it('skips preassignment when bonus = 0 (groups ignored)', () => {
    const projects = [project('a', [7], 10)];
    const students = [
      student('s1', 7, ['a'], 'g1'),
      student('s2', 7, ['a'], 'g1'),
    ];
    const result = preassignGroups(students, projects, { ...defaultSolverConfig, groupCohesionBonus: 0 });
    // bonus * (2-1) = 0; prioCost = (10-10)*2 = 0; 0 >= 0 → still accepts at prio 1
    expect(result.preassignments.size).toBe(2);
  });

  it('rejects deep prio drop when bonus is small', () => {
    // 2-member group, only prio 3 has room (cap 10), prio 1+2 full.
    // With bonus=1: cohesionGain=1, prioCost at prio3 = (10-3)*2 = 14 → reject.
    const projects = [
      project('a', [7], 1),
      project('b', [7], 1),
      project('c', [7], 10),
    ];
    const students = [
      student('s1', 7, ['a', 'b', 'c'], 'g1'),
      student('s2', 7, ['a', 'b', 'c'], 'g1'),
    ];
    const result = preassignGroups(students, projects, { ...defaultSolverConfig, groupCohesionBonus: 1 });
    expect(result.preassignments.size).toBe(0);
    expect(result.remainingStudents).toHaveLength(2);
  });
});
