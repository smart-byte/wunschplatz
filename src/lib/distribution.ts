import type { Assignment, Project, SolverConfig, SolverStats, Student } from '@/types';

export type DistributionRow = {
  student: Student;
  assignment: Assignment;
  assignedProject: Project | null;
};

export function priorityRank(student: Student, project?: Project | null): number | null {
  if (!project || !project.grades.includes(student.grade)) return null;
  const index = student.priorities.indexOf(project.id);
  return index >= 0 && index < 5 ? index + 1 : null;
}

export function distributionRows(
  students: Student[],
  projects: Project[],
  assignments: Assignment[],
): DistributionRow[] {
  const byStudent = new Map(assignments.map((a) => [a.studentId, a]));
  const byProject = new Map(projects.map((p) => [p.id, p]));
  return students.map((student) => {
    const saved = byStudent.get(student.id);
    const project = saved?.projectId ? (byProject.get(saved.projectId) ?? null) : null;
    return {
      student,
      assignedProject: project,
      assignment: {
        studentId: student.id,
        projectId: project?.id ?? null,
        priorityRank: priorityRank(student, project),
        manuallyEdited: saved?.manuallyEdited ?? false,
      },
    };
  });
}

export function distributionStats(assignments: Assignment[]): SolverStats {
  const stats: SolverStats = {
    totalStudents: assignments.length,
    assignedByPriority: [0, 0, 0, 0, 0],
    notInTop5: 0,
    unassigned: 0,
  };
  for (const assignment of assignments) {
    if (!assignment.projectId) stats.unassigned++;
    else if (assignment.priorityRank === null) stats.notInTop5++;
    else stats.assignedByPriority[assignment.priorityRank - 1]++;
  }
  return stats;
}

/** Only solver inputs: renaming a student/project does not invalidate a run. */
export function solverInputSignature(
  students: Student[],
  projects: Project[],
  config: SolverConfig,
): string {
  return JSON.stringify({
    students: students.map((s) => [s.id, s.grade, s.priorities, s.groupId ?? null]),
    projects: projects.map((p) => [p.id, p.grades, p.maxCapacity, p.targetCapacity]),
    config: [
      config.priorityWeights,
      config.unmatchedPenalty,
      config.overTargetPenalty,
      config.notInTop5Penalty,
      config.groupCohesionBonus,
    ],
  });
}

export function assignmentConflicts(student: Student, target: Project, rows: DistributionRow[]) {
  const load = rows.filter(
    (r) => r.student.id !== student.id && r.assignment.projectId === target.id,
  ).length;
  return {
    gradeMismatch: !target.grades.includes(student.grade),
    full: load >= target.maxCapacity,
    load,
  };
}
