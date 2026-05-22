import { useMemo } from 'react';
import { useActiveDistribution } from '@/store/useAssignmentsStore';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useProjectsStore } from '@/store/useProjectsStore';
import type { Project, Student, Assignment } from '@/types';

export type RowData = {
  student: Student;
  assignment: Assignment | null;
  assignedProject: Project | null;
};

export function useDistributionData() {
  const activeDist = useActiveDistribution();
  const assignments = activeDist?.assignments ?? [];
  const students = useStudentsStore((s) => s.students);
  const projects = useProjectsStore((s) => s.projects);

  const rows = useMemo<RowData[]>(() => {
    const aMap = new Map(assignments.map((a) => [a.studentId, a]));
    const pMap = new Map(projects.map((p) => [p.id, p]));
    return students.map((s) => {
      const a = aMap.get(s.id) ?? null;
      const project = a?.projectId ? pMap.get(a.projectId) ?? null : null;
      return { student: s, assignment: a, assignedProject: project };
    });
  }, [assignments, students, projects]);

  return { rows, projects, students, assignments };
}
