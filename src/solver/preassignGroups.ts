import type { Project, Student, SolverConfig } from '@/types';

export type GroupPreassignment = {
  projectId: string;
  priorityRank: number;
};

export type PreassignResult = {
  preassignments: Map<string, GroupPreassignment>; // studentId → assignment
  consumedCapacity: Map<string, number>; // projectId → seats taken by groups
  remainingStudents: Student[];
};

export function preassignGroups(
  students: Student[],
  projects: Project[],
  config: SolverConfig,
): PreassignResult {
  const preassignments = new Map<string, GroupPreassignment>();
  const consumedCapacity = new Map<string, number>();

  const groupsMap = new Map<string, Student[]>();
  for (const s of students) {
    if (!s.groupId) continue;
    if (!groupsMap.has(s.groupId)) groupsMap.set(s.groupId, []);
    groupsMap.get(s.groupId)!.push(s);
  }
  const groups = [...groupsMap.values()].filter((m) => m.length >= 2);
  groups.sort((a, b) => b.length - a.length);

  const maxWeight = Math.max(...config.priorityWeights);
  const bonus = config.groupCohesionBonus;

  for (const members of groups) {
    const priorities = members[0].priorities; // Group members share priorities, enforced by the store.
    let unplaced = [...members];

    while (unplaced.length >= 2) {
      let placed = false;
      for (let size = unplaced.length; size >= 2 && !placed; size--) {
        const subgroup = unplaced.slice(0, size);
        const subgroupGrades = subgroup.map((s) => s.grade);
        for (let k = 0; k < priorities.length; k++) {
          const projId = priorities[k];
          const project = projects.find((p) => p.id === projId);
          if (!project) continue;
          if (!subgroupGrades.every((g) => project.grades.includes(g))) continue;
          const used = consumedCapacity.get(projId) ?? 0;
          if (project.maxCapacity - used < size) continue;
          // A lower-ranked choice must earn back its priority cost through cohesion.
          const cohesionGain = bonus * (size - 1);
          const prioCost = (maxWeight - config.priorityWeights[k]) * size;
          if (cohesionGain < prioCost) continue;
          for (const m of subgroup) {
            preassignments.set(m.id, { projectId: projId, priorityRank: k + 1 });
          }
          consumedCapacity.set(projId, used + size);
          unplaced = unplaced.slice(size);
          placed = true;
          break;
        }
      }
      if (!placed) break;
    }
  }

  const remainingStudents = students.filter((s) => !preassignments.has(s.id));
  return { preassignments, consumedCapacity, remainingStudents };
}
