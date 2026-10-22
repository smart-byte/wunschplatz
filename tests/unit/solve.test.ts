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
      {
        id: 's1',
        firstName: 'A',
        lastName: 'X',
        className: '7a',
        grade: 7,
        priorities: ['a', 'b'],
      },
      {
        id: 's2',
        firstName: 'B',
        lastName: 'X',
        className: '7a',
        grade: 7,
        priorities: ['b', 'a'],
      },
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
      {
        id: 's1',
        firstName: 'A',
        lastName: 'X',
        className: '7a',
        grade: 7,
        priorities: ['a', 'b'],
      },
      {
        id: 's2',
        firstName: 'B',
        lastName: 'X',
        className: '7a',
        grade: 7,
        priorities: ['a', 'b'],
      },
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
  it('preserves student order when combining group, individual, and unassigned results', () => {
    const projects: Project[] = [
      { id: 'a', name: 'A', grades: [7], maxCapacity: 2, targetCapacity: 2 },
      { id: 'b', name: 'B', grades: [7], maxCapacity: 1, targetCapacity: 1 },
    ];
    const student: Student = {
      id: 'individual',
      firstName: 'A',
      lastName: 'X',
      className: '7a',
      grade: 7,
      priorities: ['a', 'b'],
    };
    const { assignments, stats } = solveAssignments(
      [
        student,
        { ...student, id: 'group-1', groupId: 'g' },
        { ...student, id: 'ineligible', grade: 8 },
        { ...student, id: 'group-2', groupId: 'g' },
        { ...student, id: 'no-room', priorities: [] },
      ],
      projects,
      defaultSolverConfig,
    );
    expect(assignments).toEqual([
      { studentId: 'individual', projectId: 'b', priorityRank: 2, manuallyEdited: false },
      { studentId: 'group-1', projectId: 'a', priorityRank: 1, manuallyEdited: false },
      { studentId: 'ineligible', projectId: null, priorityRank: null, manuallyEdited: false },
      { studentId: 'group-2', projectId: 'a', priorityRank: 1, manuallyEdited: false },
      { studentId: 'no-room', projectId: null, priorityRank: null, manuallyEdited: false },
    ]);
    expect(stats).toEqual({
      totalStudents: 5,
      assignedByPriority: [2, 1, 0, 0, 0],
      notInTop5: 0,
      unassigned: 2,
    });
  });

  it('keeps group together on shared prio1', () => {
    const projects: Project[] = [
      { id: 'a', name: 'A', grades: [7], maxCapacity: 5, targetCapacity: 4 },
      { id: 'b', name: 'B', grades: [7], maxCapacity: 5, targetCapacity: 4 },
    ];
    const students: Student[] = [
      {
        id: 's1',
        firstName: 'A',
        lastName: 'X',
        className: '7a',
        grade: 7,
        priorities: ['a', 'b'],
        groupId: 'g1',
      },
      {
        id: 's2',
        firstName: 'B',
        lastName: 'X',
        className: '7a',
        grade: 7,
        priorities: ['a', 'b'],
        groupId: 'g1',
      },
      {
        id: 's3',
        firstName: 'C',
        lastName: 'X',
        className: '7a',
        grade: 7,
        priorities: ['a', 'b'],
        groupId: 'g1',
      },
    ];
    const { assignments } = solveAssignments(students, projects, defaultSolverConfig);
    const projectsAssigned = new Set(assignments.map((a) => a.projectId));
    expect(projectsAssigned.size).toBe(1);
    expect(assignments.every((a) => a.priorityRank === 1)).toBe(true);
  });

  it('group falls back to prio2 if prio1 cannot fit whole group', () => {
    const projects: Project[] = [
      { id: 'a', name: 'A', grades: [7], maxCapacity: 1, targetCapacity: 1 },
      { id: 'b', name: 'B', grades: [7], maxCapacity: 5, targetCapacity: 4 },
    ];
    const students: Student[] = [
      {
        id: 's1',
        firstName: 'A',
        lastName: 'X',
        className: '7a',
        grade: 7,
        priorities: ['a', 'b'],
        groupId: 'g1',
      },
      {
        id: 's2',
        firstName: 'B',
        lastName: 'X',
        className: '7a',
        grade: 7,
        priorities: ['a', 'b'],
        groupId: 'g1',
      },
    ];
    const { assignments } = solveAssignments(students, projects, defaultSolverConfig);
    expect(assignments.every((a) => a.projectId === 'b')).toBe(true);
    expect(assignments.every((a) => a.priorityRank === 2)).toBe(true);
  });

  it('does not give up a solo wish to seat a group', () => {
    const projects: Project[] = [
      { id: 'a', name: 'A', grades: [7], maxCapacity: 2, targetCapacity: 2 },
      { id: 'b', name: 'B', grades: [7], maxCapacity: 2, targetCapacity: 2 },
    ];
    const student = (id: string, priorities: string[], groupId?: string): Student => ({
      id,
      firstName: id,
      lastName: 'X',
      className: '7a',
      grade: 7,
      priorities,
      groupId,
    });
    const { assignments } = solveAssignments(
      [
        student('g1', ['a', 'b'], 'g'),
        student('g2', ['a', 'b'], 'g'),
        student('i1', ['a']),
        student('i2', ['b']),
      ],
      projects,
      defaultSolverConfig,
    );
    const byId = new Map(assignments.map((a) => [a.studentId, a]));
    expect(byId.get('i1')).toMatchObject({ projectId: 'a', priorityRank: 1 });
    expect(byId.get('i2')).toMatchObject({ projectId: 'b', priorityRank: 1 });
    expect(assignments.every((a) => a.priorityRank !== null)).toBe(true);
  });

  // Cases where the greedy group step and the plain flow both missed the best seating, which
  // was found by enumerating every valid one. Projects: id:grades:max:target. Students:
  // grade, group (- for none), wishes.
  it.each([
    {
      bonus: 8,
      best: 51,
      projects: 'R:78:2:2 T:5678:2:0 S:5678:2:1 K:5678:2:0',
      students: '5A:ST 7A:ST 5B:KTR 7B:KTR 5-:SKRT 7-:TRK 5-:RSTK 7-:SKT',
    },
    {
      bonus: 8,
      best: -1946,
      projects: 'R:78:1:0 T:5678:2:2 S:5678:1:1 K:5678:2:0',
      students: '5A:KTSR 7A:KTSR 5B:KST 7B:KST 5-:KRTS 7-:STR 5-:TRSK 7-:KSTR',
    },
    {
      bonus: 8,
      best: -940,
      projects: 'R:5678:4:2 T:5678:1:0 S:5678:1:1 K:5678:1:1',
      students: '5A:SRKT 7A:SRKT 5B:TR 7B:TR 5-:KT 7-:RSK 5-:KS 7-:RTS',
    },
    {
      bonus: 30,
      best: 124,
      projects: 'R:5678:3:2 T:5678:1:0 S:5678:4:1 K:5678:1:1',
      students: '5A:RSK 7A:RSK 5B:RTSK 7B:RTSK 5-:RTSK 7-:SKT 5-:KRST 7-:SKTR',
    },
  ])('finds the best seating worth $best', ({ bonus, best, projects, students }) => {
    const { run } = solveAssignments(
      students.split(' ').map((spec, i): Student => {
        const [grade, group, wishes] = [Number(spec[0]), spec[1], spec.slice(3)];
        return {
          id: `s${i}`,
          firstName: `S${i}`,
          lastName: 'X',
          className: `${grade}a`,
          grade,
          priorities: [...wishes],
          groupId: group === '-' ? undefined : group,
        };
      }),
      projects.split(' ').map((spec): Project => {
        const [id, grades, max, target] = spec.split(':');
        return {
          id,
          name: id,
          grades: [...grades].map(Number),
          maxCapacity: Number(max),
          targetCapacity: Number(target),
        };
      }),
      { ...defaultSolverConfig, groupCohesionBonus: bonus },
    );
    expect(run.score).toBe(best);
  });

  it('keeps a group together when the cohesion bonus outweighs the flow optimum', () => {
    // Splitting the group is 3 points better for the flow, but keeping it together is worth 8.
    const projects: Project[] = [
      { id: 'a', name: 'A', grades: [7], maxCapacity: 2, targetCapacity: 2 },
      { id: 'b', name: 'B', grades: [7], maxCapacity: 1, targetCapacity: 1 },
      { id: 'p', name: 'P', grades: [7], maxCapacity: 0, targetCapacity: 0 },
      { id: 'c', name: 'C', grades: [7], maxCapacity: 5, targetCapacity: 5 },
    ];
    const student = (id: string, priorities: string[], groupId?: string): Student => ({
      id,
      firstName: id,
      lastName: 'X',
      className: '7a',
      grade: 7,
      priorities,
      groupId,
    });
    const { assignments } = solveAssignments(
      [
        student('g1', ['a', 'b'], 'g'),
        student('g2', ['a', 'b'], 'g'),
        student('i1', ['a', 'p', 'c']),
      ],
      projects,
      defaultSolverConfig,
    );
    const byId = new Map(assignments.map((a) => [a.studentId, a]));
    expect(byId.get('g1')?.projectId).toBe('a');
    expect(byId.get('g2')?.projectId).toBe('a');
    expect(byId.get('i1')).toMatchObject({ projectId: 'c', priorityRank: 3 });
  });
});
