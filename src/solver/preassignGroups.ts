import type { Project, Student, SolverConfig } from '@/types';

export type GroupPreassignment = {
  projectId: string;
  priorityRank: number;
};

/**
 * Greedy group pre-assignment. Groups are seated largest first, each as large a subgroup as
 * possible at the highest wish that fits. A lower-ranked wish is taken only when the cohesion
 * bonus outweighs its priority drop:
 *
 *   bonus × (subgroupSize − 1)  ≥  (maxWeight − weightAtRank) × subgroupSize
 *
 * Returns the placed members by student ID; the flow solver seats everyone else. Because the
 * greedy order ignores its effect on other students, solveAssignments also solves without this
 * step and searches group placements from the better result.
 */
export function preassignGroups(
  students: Student[],
  projects: Project[],
  config: SolverConfig,
): Map<string, GroupPreassignment> {
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
          if (k >= 5) break;
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

  return preassignments;
}
