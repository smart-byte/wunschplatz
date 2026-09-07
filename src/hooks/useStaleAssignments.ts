import { useSolverConfigStore } from '@/store/useSolverConfigStore';
import { solverInputSignature } from '@/lib/distribution';
import { useActiveDistribution } from '@/store/useAssignmentsStore';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useProjectsStore } from '@/store/useProjectsStore';

export function useStaleAssignments(): { stale: boolean; reasonKey: string | null } {
  const activeDist = useActiveDistribution();
  const students = useStudentsStore((s) => s.students);
  const projects = useProjectsStore((s) => s.projects);

  const config = useSolverConfigStore((s) => s.config);

  if (!activeDist) return { stale: false, reasonKey: null };

  const { assignments, run: lastRun } = activeDist;

  const studentIds = new Set(students.map((s) => s.id));
  const projectIds = new Set(projects.map((p) => p.id));
  const assignedStudents = new Set(assignments.map((a) => a.studentId));

  for (const id of assignedStudents)
    if (!studentIds.has(id)) {
      return { stale: true, reasonKey: 'distribution.stale.reasons.studentsChanged' };
    }
  for (const a of assignments) {
    if (a.projectId && !projectIds.has(a.projectId)) {
      return { stale: true, reasonKey: 'distribution.stale.reasons.projectDeleted' };
    }
  }
  if (students.length > assignedStudents.size) {
    return { stale: true, reasonKey: 'distribution.stale.reasons.newStudentsImported' };
  }
  if (
    lastRun.kind !== 'manual' &&
    lastRun.stats.totalStudents > 0 &&
    lastRun.inputSignature !== solverInputSignature(students, projects, config)
  ) {
    return { stale: true, reasonKey: 'distribution.stale.reasons.inputsChanged' };
  }
  return { stale: false, reasonKey: null };
}
