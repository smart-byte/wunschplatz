import { Badge } from '@/components/ui/badge';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Assignment, Project, Student } from '@/types';

type Props = {
  student: Student;
  assignment: Assignment | null;
  projects: Project[];
  size?: 'sm' | 'xs';
  /** When true, the tooltip is suppressed (used while parent is dragging). */
  disableTooltip?: boolean;
};

export function AssignmentBadge({
  student, assignment, projects, size = 'sm', disableTooltip = false,
}: Props) {
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? '?';
  const prios = student.priorities;

  const prioList = prios.length === 0
    ? '(keine Prioritäten gesetzt)'
    : prios.map((id, i) => `${i + 1}. ${projectName(id)}`).join('\n');

  let label: string;
  let variant: 'secondary' | 'outline' | 'destructive' = 'outline';
  let status: string;

  if (!assignment || assignment.projectId === null) {
    label = 'unverteilt';
    variant = 'outline';
    status = 'Schüler ist keinem Projekt zugewiesen.';
  } else if (assignment.priorityRank !== null) {
    label = `Prio ${assignment.priorityRank}`;
    variant = 'secondary';
    status = `Schüler hat Wunsch Nr. ${assignment.priorityRank} erhalten.`;
  } else {
    label = 'außerhalb';
    variant = 'outline';
    status = 'Schüler wurde einem Projekt außerhalb seiner Top-5 zugewiesen.';
  }

  const sizeClass = size === 'xs' ? 'text-[10px] py-0 px-1' : '';

  if (disableTooltip) {
    return <Badge variant={variant} className={sizeClass}>{label}</Badge>;
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip open={disableTooltip ? false : undefined}>
        <TooltipTrigger asChild>
          <Badge variant={variant} className={sizeClass}>{label}</Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs font-medium">{status}</p>
          <p className="text-xs mt-2 opacity-80 whitespace-pre-line">
            <span className="font-medium">Prio-Wünsche:</span>{'\n'}{prioList}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
