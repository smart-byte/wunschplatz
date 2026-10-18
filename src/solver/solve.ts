import { distributionStats, priorityRank, solverInputSignature } from '@/lib/distribution';
import { buildAssignmentGraph } from './buildGraph';
import { preassignGroups } from './preassignGroups';
import type { Project, Student, SolverConfig, Assignment, SolverStats, SolverRun } from '@/types';

export type SolveResult = {
  assignments: Assignment[];
  run: SolverRun;
  stats: SolverStats;
};

export function solveAssignments(
  students: Student[],
  projects: Project[],
  config: SolverConfig,
): SolveResult {
  const { preassignments, consumedCapacity, remainingStudents } = preassignGroups(
    students,
    projects,
    config,
  );
  const adjustedProjects = projects.map((project) => {
    const consumed = consumedCapacity.get(project.id) ?? 0;
    return {
      ...project,
      maxCapacity: Math.max(0, project.maxCapacity - consumed),
      targetCapacity: Math.max(0, project.targetCapacity - consumed),
    };
  });

  const withGroups = flowSeats(remainingStudents, adjustedProjects, config);
  for (const [studentId, { projectId }] of preassignments) withGroups.set(studentId, projectId);
  let seats = withGroups;
  let score = scoreSeats(students, projects, config, withGroups);

  // The group step can cost a solo student a wish, so the flow without it is a second candidate.
  // A tie keeps the group result.
  if (preassignments.size > 0) {
    const withoutGroups = flowSeats(students, projects, config);
    const withoutScore = scoreSeats(students, projects, config, withoutGroups);
    if (withoutScore > score) {
      seats = withoutGroups;
      score = withoutScore;
    }
  }

  const projectById = new Map(projects.map((project) => [project.id, project]));
  const assignments = students.map((student): Assignment => {
    const projectId = seats.get(student.id) ?? null;
    return {
      studentId: student.id,
      projectId,
      priorityRank: priorityRank(student, projectId === null ? null : projectById.get(projectId)),
      manuallyEdited: false,
    };
  });
  const stats = distributionStats(assignments);
  const run: SolverRun = {
    kind: 'solver',
    inputSignature: solverInputSignature(students, projects, config),
    timestamp: Date.now(),
    config,
    score,
    stats,
  };

  return { assignments, run, stats };
}

/** Min-cost flow over the given students; maps every student that gets a seat to its project. */
function flowSeats(
  students: Student[],
  projects: Project[],
  config: SolverConfig,
): Map<string, string> {
  const seats = new Map<string, string>();
  if (students.length === 0) return seats;
  const { mcf, nodeMap, sourceIdx, sinkIdx } = buildAssignmentGraph(students, projects, config);
  mcf.solve(sourceIdx, sinkIdx);
  const studentByNode = new Map([...nodeMap.studentToIdx].map(([id, node]) => [node, id]));
  const projectByNode = new Map([...nodeMap.projectToIdx].map(([id, node]) => [node, id]));
  for (const { from, to } of mcf.getFlows()) {
    const studentId = studentByNode.get(from);
    const projectId = projectByNode.get(to);
    if (studentId !== undefined && projectId !== undefined) seats.set(studentId, projectId);
  }
  return seats;
}

/**
 * Objective of a complete assignment in the flow's cost model, with the sign flipped: priority
 * weights earned, minus the notInTop5, unmatched and over-target penalties, plus the cohesion
 * bonus for each group cluster (same-group students on one project). This is the run score.
 */
function scoreSeats(
  students: Student[],
  projects: Project[],
  config: SolverConfig,
  seats: Map<string, string>,
): number {
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const load = new Map<string, number>();
  const clusters = new Map<string, number>();
  let score = 0;
  for (const student of students) {
    const projectId = seats.get(student.id);
    if (projectId === undefined) {
      score -= config.unmatchedPenalty;
      continue;
    }
    load.set(projectId, (load.get(projectId) ?? 0) + 1);
    const rank = priorityRank(student, projectById.get(projectId));
    score += rank === null ? -config.notInTop5Penalty : config.priorityWeights[rank - 1];
    if (student.groupId) {
      const key = JSON.stringify([student.groupId, projectId]);
      clusters.set(key, (clusters.get(key) ?? 0) + 1);
    }
  }
  for (const project of projects) {
    const tier1 = Math.min(project.targetCapacity, project.maxCapacity);
    score -= config.overTargetPenalty * Math.max(0, (load.get(project.id) ?? 0) - tier1);
  }
  for (const size of clusters.values()) score += config.groupCohesionBonus * (size - 1);
  return score;
}
