import { expect, it } from 'vitest';
import { reconcileWorkspace } from '@/store/reconcileWorkspace';
import { emptyRoundData } from '@/store/workspaceState';
import { buildBlueprint } from '@/forms/buildBlueprint';
import type { SavedRound } from '@/store/persist';
import type { Student } from '@/types';

const student = (id: string): Student => ({
  id,
  firstName: id,
  lastName: 'Test',
  className: '7a',
  grade: 7,
  priorities: ['p0', 'p1'],
});
function rounds(): SavedRound[] {
  return [
    {
      id: 'r',
      name: 'Round',
      createdAt: 'x',
      data: {
        ...emptyRoundData(),
        projects: Array.from({ length: 3 }, (_, i) => ({
          id: `p${i}`,
          name: `Project ${i}`,
          grades: [7],
          maxCapacity: 20,
          targetCapacity: 15,
        })),
        students: [student('a'), student('b')],
      },
    },
  ];
}

it('does not leave wishes pointing at a concurrently deleted project or promote later wishes', () => {
  const base = rounds();
  const local = structuredClone(base);
  const remote = structuredClone(base);
  local[0].data.students.push(student('new'));
  remote[0].data.projects.shift();
  const data = reconcileWorkspace(base, local, remote).value[0].data;
  expect(data.students).toHaveLength(3);
  expect(data.students.every((s) => s.priorities.length === 0)).toBe(true);
});

it('keeps independently edited manual assignments in one distribution', () => {
  const base = rounds();
  base[0].data.distributions = [
    {
      id: 'd',
      name: 'Manual',
      createdAt: 0,
      updatedAt: 0,
      run: {
        timestamp: 0,
        config: emptyRoundData().solverConfig,
        score: 0,
        stats: {
          totalStudents: 2,
          assignedByPriority: [2, 0, 0, 0, 0],
          notInTop5: 0,
          unassigned: 0,
        },
      },
      assignments: base[0].data.students.map((s) => ({
        studentId: s.id,
        projectId: 'p0',
        priorityRank: 1,
        manuallyEdited: true,
      })),
    },
  ];
  const local = structuredClone(base);
  const remote = structuredClone(base);
  local[0].data.distributions[0].assignments[0].projectId = 'p1';
  remote[0].data.distributions[0].assignments[1].projectId = 'p2';
  const data = reconcileWorkspace(base, local, remote).value[0].data;
  expect(data.distributions[0].assignments.map((a) => a.projectId)).toEqual(['p1', 'p2']);
  expect(data.distributionActiveId).toBeNull();
});

it('keeps each generated blueprint intact when tabs regenerate different versions', () => {
  const base = rounds();
  const local = structuredClone(base);
  const remote = structuredClone(base);
  const blueprint = (count: number, date: string) => {
    const built = buildBlueprint(base[0].data.projects.slice(0, count), date);
    if (!built.ok) throw new Error('Invalid fixture');
    return built.blueprint;
  };
  base[0].blueprint = blueprint(2, 'before');
  local[0].blueprint = blueprint(2, 'local');
  remote[0].blueprint = blueprint(3, 'remote');
  const merged = reconcileWorkspace(base, local, remote);
  expect(merged.value[0].blueprint).toEqual(local[0].blueprint);
  expect(merged.conflict).toBe(true);
});

it('does not combine valid capacity edits into an impossible target and maximum', () => {
  const base = rounds();
  const local = structuredClone(base);
  const remote = structuredClone(base);
  local[0].data.projects[0].targetCapacity = 18;
  remote[0].data.projects[0].maxCapacity = 16;
  const merged = reconcileWorkspace(base, local, remote);
  expect(merged.value[0].data.projects[0]).toMatchObject({ targetCapacity: 18, maxCapacity: 20 });
  expect(merged.conflict).toBe(true);
});

it('keeps a concurrently joined group member on the group’s edited wishes', () => {
  const base = rounds();
  base[0].data.students.forEach((s) => {
    s.groupId = 'g';
  });
  const local = structuredClone(base);
  const remote = structuredClone(base);
  local[0].data.students.forEach((s) => {
    s.priorities = ['p1', 'p0'];
  });
  remote[0].data.students.push({ ...student('new'), groupId: 'g' });
  expect(
    reconcileWorkspace(base, local, remote).value[0].data.students.map((s) => s.priorities),
  ).toEqual([
    ['p1', 'p0'],
    ['p1', 'p0'],
    ['p1', 'p0'],
  ]);
});

it('preserves a surviving round when two tabs delete each other’s selected round', () => {
  const base = rounds();
  base.push({ ...structuredClone(base[0]), id: 'second' });
  const result = reconcileWorkspace(base, [base[0]], [base[1]]);
  expect(result.value.map((r) => r.id)).toEqual(['second']);
  expect(result.conflict).toBe(true);
});
