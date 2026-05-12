import { buildAssignmentGraph } from './buildGraph';
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
  const { mcf, nodeMap, sourceIdx, sinkIdx } = buildAssignmentGraph(students, projects, config);
  const flowResult = mcf.solve(sourceIdx, sinkIdx);
  const flows = mcf.getFlows();

  const idxToProject = new Map<number, string>();
  for (const [id, idx] of nodeMap.projectToIdx.entries()) idxToProject.set(idx, id);

  const assignments: Assignment[] = students.map((s) => {
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

  const run: SolverRun = {
    timestamp: Date.now(),
    config,
    score: -flowResult.totalCost,
    stats,
  };

  return { assignments, run, stats };
}
