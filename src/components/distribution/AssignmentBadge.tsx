import { cn } from '@/lib/utils';
import { priorityRank } from '@/lib/distribution';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Assignment, Project, Student } from '@/types';

type Props = {
  student: Student;
  assignment: Assignment;
  projects: Project[];
  size?: 'sm' | 'xs';
  disableTooltip?: boolean;
  /** Boards stay quiet for the common case and only badge the exceptions. */
  hideFirstChoice?: boolean;
};

export function AssignmentBadge({
  student,
  assignment,
  projects,
  size = 'sm',
  disableTooltip = false,
  hideFirstChoice = false,
}: Props) {
  const { t } = useTranslation('app');
  const project = projects.find((p) => p.id === assignment.projectId);
  if (!project) return null;
  const rank = priorityRank(student, project);
  if (hideFirstChoice && rank === 1) return null;
  const badge = (
    <Badge
      variant={rank !== null ? 'secondary' : 'outline'}
      className={cn(
        'shrink-0 rounded-sm border-0 font-medium',
        rank === 1
          ? 'bg-mark/[0.08] text-mark'
          : rank !== null
            ? 'bg-mark-2/[0.08] text-[#18758f]'
            : 'bg-amber-50 text-amber-800',
        size === 'xs' && 'px-1.5 py-0.5 text-[10px]',
      )}
    >
      {rank !== null
        ? t('distribution.prioLabel', { n: rank })
        : t('distribution.badge.outsideLabel')}
    </Badge>
  );
  if (disableTooltip) return badge;

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? '?';
  const prioList =
    student.priorities.length === 0
      ? t('distribution.badge.noPriorities')
      : student.priorities.map((id, i) => `${i + 1}. ${projectName(id)}`).join('\n');

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs font-medium">
            {rank !== null
              ? t('distribution.badge.prioStatus', { n: rank })
              : t('distribution.badge.outsideStatus')}
          </p>
          <p className="text-xs mt-2 opacity-80 whitespace-pre-line">
            <span className="font-medium">{t('distribution.badge.prioWishes')}</span>
            {'\n'}
            {prioList}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
