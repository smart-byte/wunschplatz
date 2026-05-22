import type { Project, Student } from '@/types';

export type GroupPreassignment = {
  projectId: string;
  priorityRank: number;
};

export type PreassignResult = {
  preassignments: Map<string, GroupPreassignment>; // studentId → assignment
  consumedCapacity: Map<string, number>;           // projectId → seats taken by groups
  remainingStudents: Student[];                    // students NOT preassigned (singletons + unfittable groups)
};

/**
 * Greedy pre-assignment of student groups (size ≥ 2) to projects.
 * Larger groups go first to handle capacity contention.
 * For each group, walks shared priorities in order and assigns to the first
 * project that (a) accepts EVERY member's grade and (b) has enough free seats
 * for the whole group. Groups that don't fit anywhere are left for MCMF.
 */
export function preassignGroups(students: Student[], projects: Project[]): PreassignResult {
  const preassignments = new Map<string, GroupPreassignment>();
  const consumedCapacity = new Map<string, number>();

  // Collect groups (size ≥ 2 only — singletons handled by MCMF).
  const groupsMap = new Map<string, Student[]>();
  for (const s of students) {
    if (!s.groupId) continue;
    if (!groupsMap.has(s.groupId)) groupsMap.set(s.groupId, []);
    groupsMap.get(s.groupId)!.push(s);
  }
  const groups = [...groupsMap.values()].filter((m) => m.length >= 2);

  // Sort by size descending — larger groups win contended slots.
  groups.sort((a, b) => b.length - a.length);

  for (const members of groups) {
    const proto = members[0]; // priorities are shared across the group
    const size = members.length;
    const memberGrades = members.map((m) => m.grade);
    for (let k = 0; k < proto.priorities.length; k++) {
      const projId = proto.priorities[k];
      const project = projects.find((p) => p.id === projId);
      if (!project) continue;
      // Project must accept every member's grade.
      if (!memberGrades.every((g) => project.grades.includes(g))) continue;
      const used = consumedCapacity.get(projId) ?? 0;
      const free = project.maxCapacity - used;
      if (free >= size) {
        for (const m of members) {
          preassignments.set(m.id, { projectId: projId, priorityRank: k + 1 });
        }
        consumedCapacity.set(projId, used + size);
        break;
      }
    }
  }

  const remainingStudents = students.filter((s) => !preassignments.has(s.id));
  return { preassignments, consumedCapacity, remainingStudents };
}
