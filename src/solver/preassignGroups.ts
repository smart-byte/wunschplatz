import type { Project, Student, SolverConfig } from '@/types';

export type GroupPreassignment = {
  projectId: string;
  priorityRank: number;
};

export type PreassignResult = {
  preassignments: Map<string, GroupPreassignment>; // studentId → assignment
  consumedCapacity: Map<string, number>;           // projectId → seats taken by groups
  remainingStudents: Student[];                    // students NOT preassigned
};

/**
 * Greedy group pre-assignment with cohesion-vs-priority trade-off.
 *
 * For each group (largest first) the solver tries to seat as large a subgroup
 * as possible at as high a priority as possible. A placement is accepted only
 * when the cohesion bonus outweighs the priority drop:
 *
 *   bonus × (subgroupSize − 1)  ≥  (maxWeight − weightAtRank) × subgroupSize
 *
 * Members that can't be placed together fall through to the MCMF solver and
 * are assigned individually.
 */
export function preassignGroups(
  students: Student[],
  projects: Project[],
  config: SolverConfig,
): PreassignResult {
  const preassignments = new Map<string, GroupPreassignment>();
  const consumedCapacity = new Map<string, number>();

  // Collect groups of size ≥ 2; singletons are handled by MCMF.
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
    const proto = members[0]; // shared priorities (enforced by store)
    let unplaced = [...members];

    // Repeatedly try to place the largest possible subgroup of the remaining
    // unplaced members. Subgroup size shrinks each iteration; if no size fits
    // anywhere acceptable, stop and let MCMF handle the rest.
    while (unplaced.length >= 2) {
      let placed = false;
      // Try subgroups from largest to smallest (down to 2).
      for (let size = unplaced.length; size >= 2 && !placed; size--) {
        const subgroup = unplaced.slice(0, size);
        const subgroupGrades = subgroup.map((s) => s.grade);
        for (let k = 0; k < proto.priorities.length; k++) {
          const projId = proto.priorities[k];
          const project = projects.find((p) => p.id === projId);
          if (!project) continue;
          if (!subgroupGrades.every((g) => project.grades.includes(g))) continue;
          const used = consumedCapacity.get(projId) ?? 0;
          if (project.maxCapacity - used < size) continue;
          // Threshold check: is the prio drop worth the cohesion gain?
          const cohesionGain = bonus * (size - 1);
          const prioCost = (maxWeight - config.priorityWeights[k]) * size;
          if (cohesionGain < prioCost) continue;
          // Accept placement.
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
