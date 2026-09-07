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
  const projectIdByStudent = new Map(
    [...preassignments].map(([studentId, assignment]) => [studentId, assignment.projectId]),
  );
  const adjustedProjects = projects.map((project) => {
    const consumed = consumedCapacity.get(project.id) ?? 0;
    return {
      ...project,
      maxCapacity: Math.max(0, project.maxCapacity - consumed),
      targetCapacity: Math.max(0, project.targetCapacity - consumed),
    };
  });

  let flowCost = 0;
  if (remainingStudents.length > 0) {
    const { mcf, nodeMap, sourceIdx, sinkIdx } = buildAssignmentGraph(
      remainingStudents,
      adjustedProjects,
      config,
    );
    flowCost = mcf.solve(sourceIdx, sinkIdx).totalCost;
    const studentByNode = new Map([...nodeMap.studentToIdx].map(([id, node]) => [node, id]));
    const projectByNode = new Map([...nodeMap.projectToIdx].map(([id, node]) => [node, id]));
    for (const { from, to } of mcf.getFlows()) {
      const studentId = studentByNode.get(from);
      const projectId = projectByNode.get(to);
      if (studentId !== undefined && projectId !== undefined) {
        projectIdByStudent.set(studentId, projectId);
      }
    }
  }

  const projectById = new Map(projects.map((project) => [project.id, project]));
  const assignments = students.map((student): Assignment => {
    const projectId = projectIdByStudent.get(student.id) ?? null;
    return {
      studentId: student.id,
      projectId,
      priorityRank: priorityRank(student, projectId === null ? null : projectById.get(projectId)),
      manuallyEdited: false,
    };
  });
  const stats = distributionStats(assignments);
  let groupScore = 0;
  for (const assignment of preassignments.values()) {
    groupScore += config.priorityWeights[assignment.priorityRank - 1] ?? 0;
  }
  const run: SolverRun = {
    kind: 'solver',
    inputSignature: solverInputSignature(students, projects, config),
    timestamp: Date.now(),
    config,
    score: groupScore - flowCost,
    stats,
  };

  return { assignments, run, stats };
}
