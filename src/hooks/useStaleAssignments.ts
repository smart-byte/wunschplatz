import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useProjectsStore } from '@/store/useProjectsStore';

export function useStaleAssignments(): { stale: boolean; reason: string | null } {
  const lastRun = useAssignmentsStore((s) => s.lastRun);
  const assignments = useAssignmentsStore((s) => s.assignments);
  const students = useStudentsStore((s) => s.students);
  const projects = useProjectsStore((s) => s.projects);

  if (!lastRun || assignments.length === 0) return { stale: false, reason: null };

  const studentIds = new Set(students.map((s) => s.id));
  const projectIds = new Set(projects.map((p) => p.id));
  const assignedStudents = new Set(assignments.map((a) => a.studentId));

  for (const id of assignedStudents) if (!studentIds.has(id)) {
    return { stale: true, reason: 'Schüler-Liste geändert' };
  }
  for (const a of assignments) {
    if (a.projectId && !projectIds.has(a.projectId)) {
      return { stale: true, reason: 'Projekt gelöscht' };
    }
  }
  if (students.length > assignedStudents.size) {
    return { stale: true, reason: 'Neue Schüler importiert' };
  }
  return { stale: false, reason: null };
}
