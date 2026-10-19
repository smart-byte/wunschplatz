import { useMemo } from 'react';
import { useActiveDistribution } from '@/store/useAssignmentsStore';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useProjectsStore } from '@/store/useProjectsStore';
import { distributionRows } from '@/lib/distribution';
import type { Assignment } from '@/types';

const EMPTY_ASSIGNMENTS: Assignment[] = [];

export function useDistributionData() {
  const activeDist = useActiveDistribution();
  const assignments = activeDist?.assignments ?? EMPTY_ASSIGNMENTS;
  const students = useStudentsStore((s) => s.students);
  const projects = useProjectsStore((s) => s.projects);

  const rows = useMemo(
    () => distributionRows(students, projects, assignments),
    [students, projects, assignments],
  );

  return { rows, projects, students, assignments };
}
