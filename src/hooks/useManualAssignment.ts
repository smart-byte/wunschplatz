import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { assignmentConflicts, priorityRank, type DistributionRow } from '@/lib/distribution';
import type { Project } from '@/types';

export function useManualAssignment(rows: DistributionRow[], projects: Project[]) {
  const { t } = useTranslation('app');
  return (studentId: string, projectId: string | null) => {
    const row = rows.find((r) => r.student.id === studentId);
    if (!row || row.assignment.projectId === projectId) return;
    const target = projects.find((p) => p.id === projectId);
    if (projectId && !target) return;
    if (target) {
      const { gradeMismatch, full, load } = assignmentConflicts(row.student, target, rows);
      const warnings = [
        gradeMismatch
          ? t('distribution.table.gradeMismatchConfirm', {
              name: target.name,
              grades: target.grades.join(', '),
            })
          : '',
        full
          ? t('distribution.table.fullConfirm', {
              name: target.name,
              current: load,
              max: target.maxCapacity,
            })
          : '',
      ].filter(Boolean);
      if (warnings.length && !confirm(warnings.join('\n\n'))) return;
    }
    useAssignmentsStore
      .getState()
      .updateAssignment(
        studentId,
        projectId,
        priorityRank(row.student, target),
        t('distribution.selector.manualName'),
      );
    toast.success(t('distribution.table.assignmentChanged'));
  };
}
