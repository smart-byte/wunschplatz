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
  // Stage 1: greedy group pre-assignment
  const pre = preassignGroups(students, projects, config);

  // Stage 2: MCMF on remaining students with reduced project capacities
  const adjustedProjects: Project[] = projects.map((p) => {
    const consumed = pre.consumedCapacity.get(p.id) ?? 0;
    return {
      ...p,
      maxCapacity: Math.max(0, p.maxCapacity - consumed),
      targetCapacity: Math.max(0, p.targetCapacity - consumed),
    };
  });

  let mcmfAssignments: Assignment[] = [];
  let mcmfCost = 0;
  if (pre.remainingStudents.length > 0) {
    const { mcf, nodeMap, sourceIdx, sinkIdx } = buildAssignmentGraph(
      pre.remainingStudents, adjustedProjects, config,
    );
    const flowResult = mcf.solve(sourceIdx, sinkIdx);
    mcmfCost = flowResult.totalCost;
    const flows = mcf.getFlows();

    const idxToProject = new Map<number, string>();
    for (const [id, idx] of nodeMap.projectToIdx.entries()) idxToProject.set(idx, id);

    mcmfAssignments = pre.remainingStudents.map((s) => {
      const sIdx = nodeMap.studentToIdx.get(s.id)!;
      const out = flows.find(
        (f) => f.from === sIdx && f.flow > 0 && idxToProject.has(f.to),
      );
      if (!out) {
        return { studentId: s.id, projectId: null, priorityRank: null, manuallyEdited: false };
      }
      const projectId = idxToProject.get(out.to)!;
      const priorityIdx = s.priorities.indexOf(projectId);
      const project = projects.find((p) => p.id === projectId)!;
      const isCompatible = project.grades.includes(s.grade);
      const priorityRank =
        priorityIdx >= 0 && priorityIdx < 5 && isCompatible ? priorityIdx + 1 : null;
      return { studentId: s.id, projectId, priorityRank, manuallyEdited: false };
    });
  }

  // Merge preassignments + MCMF assignments in original student order
  const assignments: Assignment[] = students.map((s) => {
    const preA = pre.preassignments.get(s.id);
    if (preA) {
      return {
        studentId: s.id,
        projectId: preA.projectId,
        priorityRank: preA.priorityRank,
        manuallyEdited: false,
      };
    }
    const mcmfA = mcmfAssignments.find((a) => a.studentId === s.id);
    return mcmfA ?? { studentId: s.id, projectId: null, priorityRank: null, manuallyEdited: false };
  });

  // Stats
  const assignedByPriority: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  let notInTop5 = 0;
  let unassigned = 0;
  for (const a of assignments) {
    if (a.projectId === null) unassigned++;
    else if (a.priorityRank === null) notInTop5++;
    else assignedByPriority[a.priorityRank - 1]++;
  }

  const stats: SolverStats = {
    totalStudents: students.length,
    assignedByPriority,
    notInTop5,
    unassigned,
  };

  // Compute group-aware score: preassignments contribute config.priorityWeights[rank-1] each.
  let preassignScore = 0;
  for (const [, info] of pre.preassignments.entries()) {
    preassignScore += config.priorityWeights[info.priorityRank - 1] ?? 0;
  }
  const score = preassignScore + (-mcmfCost);

  const run: SolverRun = {
    timestamp: Date.now(),
    config,
    score,
    stats,
  };

  return { assignments, run, stats };
}
