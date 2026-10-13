import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDroppable } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn, formatGrades } from '@/lib/utils';
import { StudentChip } from './StudentChip';
import { BarChart3, List } from 'lucide-react';
import type { Project, Student } from '@/types';
import type { DistributionRow } from '@/lib/distribution';

type Props = {
  project: Project;
  /** Everyone assigned to the project; drives the counts. */
  students: DistributionRow[];
  /** The subset to list, e.g. search matches. Defaults to everyone. */
  listed?: DistributionRow[];
  allProjects: Project[];
  allRows: DistributionRow[];
  popularityRanking: { project: Project; score: number }[];
  onStudentClick?: (student: Student) => void;
};

export function ProjectCard({
  project,
  students,
  listed = students,
  allProjects,
  allRows,
  popularityRanking,
  onStudentClick,
}: Props) {
  const { t } = useTranslation('app');
  const { isOver, setNodeRef } = useDroppable({ id: project.id });
  const count = students.length;
  const [expanded, setExpanded] = useState(false);
  const visibleStudents = expanded ? listed : listed.slice(0, 6);
  const overMax = count > project.maxCapacity;
  const utilization =
    project.maxCapacity > 0 ? Math.min(100, (count / project.maxCapacity) * 100) : 0;

  const interestedByRank = useMemo(() => {
    const out: DistributionRow[][] = [[], [], [], [], []];
    for (const r of allRows) {
      const idx = r.student.priorities.indexOf(project.id);
      if (idx >= 0 && idx < 5) out[idx].push(r);
    }
    return out;
  }, [allRows, project.id]);

  const totalInterested = interestedByRank.reduce((s, arr) => s + arr.length, 0);
  const popularityScore = interestedByRank.reduce((s, arr, i) => s + arr.length * (5 - i), 0);

  return (
    <section
      ref={setNodeRef}
      aria-label={project.name}
      className={cn(
        'min-w-0 rounded-lg border border-rule bg-white transition-colors',
        isOver && 'border-mark ring-2 ring-mark/20',
        overMax && 'border-amber-400',
      )}
    >
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <h3 className="min-w-0 font-serif text-xl leading-snug text-mark-ink [overflow-wrap:anywhere]">
            {project.name}
          </h3>
          <span
            aria-label={t('distribution.card.assignedAria', { count, max: project.maxCapacity })}
            className={cn(
              'shrink-0 text-lg font-medium tabular-nums',
              overMax ? 'text-amber-800' : 'text-mark-ink',
            )}
          >
            {count}
            <span className="text-sm font-normal text-prose-soft">/{project.maxCapacity}</span>
          </span>
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-prose-soft">
          <span>{t('distribution.card.grades', { grades: formatGrades(project.grades) })}</span>
          <span>{t('distribution.card.targetAria', { target: project.targetCapacity })}</span>
        </div>
        <div aria-hidden className="mt-4 h-1 overflow-hidden rounded-full bg-mark/[0.07]">
          <div
            className={cn('h-full', overMax ? 'bg-amber-500' : 'bg-mark')}
            style={{ width: `${utilization}%` }}
          />
        </div>
        {overMax && (
          <p className="mt-2 text-xs text-amber-800">{t('distribution.card.overCapacity')}</p>
        )}
      </div>
      <div className="min-h-12 border-t border-rule-soft px-3 py-1">
        {visibleStudents.map(({ student, assignment }) => (
          <StudentChip
            key={student.id}
            student={student}
            assignment={assignment}
            projects={allProjects}
            onClick={() => onStudentClick?.(student)}
          />
        ))}
        {listed.length > 6 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 w-full text-xs text-mark"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded
              ? t('distribution.board.showLess')
              : t('distribution.board.showAll', { count: listed.length })}
          </Button>
        )}
        {students.length === 0 && (
          <p className="px-2 py-4 text-xs text-prose-soft">{t('distribution.card.empty')}</p>
        )}
      </div>
      <TooltipProvider delayDuration={150}>
        <div className="flex flex-wrap items-center gap-x-4 border-t border-rule-soft px-4 py-1">
          <Popover>
            <Tooltip>
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-sm px-1 text-xs tabular-nums text-prose-soft hover:bg-accent hover:text-mark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <BarChart3 className="size-3.5" />
                    <span>{t('distribution.card.demand')}</span>
                    <span className="font-medium">{popularityScore}</span>
                  </button>
                </TooltipTrigger>
              </PopoverTrigger>
              <TooltipContent className="text-xs">
                {t('distribution.card.popularityTooltip', { score: popularityScore })}
              </TooltipContent>
            </Tooltip>
            <PopoverContent
              align="end"
              className="w-80 max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto p-3 text-xs"
            >
              <div className="font-medium text-sm">{t('distribution.card.popularityHeading')}</div>
              <p className="text-muted-foreground mt-0.5">
                {t('distribution.card.popularityDescription')}
              </p>

              <div className="mt-3 rounded border bg-muted/30 p-2">
                <div className="text-muted-foreground mb-1">
                  {t('distribution.card.calculationFor', { name: project.name })}
                </div>
                <table className="w-full text-xs tabular-nums">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="text-left font-normal">{t('distribution.card.table.rank')}</th>
                      <th className="text-right font-normal">
                        {t('distribution.card.table.count')}
                      </th>
                      <th className="text-right font-normal">
                        {t('distribution.card.table.points')}
                      </th>
                      <th className="text-right font-normal">{t('distribution.card.table.sum')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interestedByRank.map((arr, i) => {
                      const pts = 5 - i;
                      return (
                        <tr key={i}>
                          <td>{t('distribution.prioLabel', { n: i + 1 })}</td>
                          <td className="text-right">{arr.length}</td>
                          <td className="text-right text-muted-foreground">{pts}</td>
                          <td className="text-right">{arr.length * pts}</td>
                        </tr>
                      );
                    })}
                    <tr className="border-t font-medium">
                      <td colSpan={3} className="pt-1">
                        {t('distribution.card.table.total')}
                      </td>
                      <td className="text-right pt-1">{popularityScore}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-3">
                <div className="font-medium mb-1">{t('distribution.card.allProjectsHeading')}</div>
                <ol className="space-y-0.5">
                  {popularityRanking.map(({ project: p, score }, i) => {
                    const isThis = p.id === project.id;
                    return (
                      <li
                        key={p.id}
                        className={cn(
                          'flex items-center justify-between gap-2 rounded px-1.5 py-0.5',
                          isThis && 'bg-primary/10 font-medium',
                        )}
                      >
                        <span className="inline-flex items-center gap-2 min-w-0">
                          <span className="text-muted-foreground tabular-nums w-5 text-right">
                            {i + 1}.
                          </span>
                          <span className="truncate">{p.name}</span>
                        </span>
                        <span className="tabular-nums">{score}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <Tooltip>
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-sm px-1 text-xs text-prose-soft hover:bg-accent hover:text-mark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <List className="size-3.5" />
                    <span>{t('distribution.card.wishes')}</span>
                    <span className="tabular-nums font-medium">{totalInterested}</span>
                  </button>
                </TooltipTrigger>
              </PopoverTrigger>
              <TooltipContent className="text-xs">
                {t('distribution.card.interestedTooltip', { count: totalInterested })}
              </TooltipContent>
            </Tooltip>
            <PopoverContent
              align="end"
              className="w-80 max-w-[calc(100vw-2rem)] max-h-[60vh] overflow-y-auto p-3"
            >
              <div className="text-sm font-medium mb-1">
                {t('distribution.card.whoChose', { name: project.name })}
              </div>
              <div className="text-xs text-muted-foreground mb-3">
                {totalInterested === 0
                  ? t('distribution.card.noOneChose')
                  : t('distribution.card.totalInterested', { count: totalInterested })}
              </div>
              <div className="space-y-3">
                {interestedByRank.map((rows, rank) => {
                  if (rows.length === 0) return null;
                  return (
                    <div key={rank}>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {t('distribution.prioLabel', { n: rank + 1 })}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{rows.length}</span>
                      </div>
                      <ul className="space-y-1">
                        {rows.map((r) => {
                          const assignedProj = r.assignedProject;
                          const isHere = assignedProj?.id === project.id;
                          return (
                            <li
                              key={r.student.id}
                              className="flex items-center justify-between gap-2 text-xs"
                            >
                              <button
                                type="button"
                                onClick={() => onStudentClick?.(r.student)}
                                className="text-left hover:underline truncate flex-1 min-w-0"
                              >
                                {r.student.lastName}, {r.student.firstName}
                                <span className="text-muted-foreground ml-1">
                                  ({r.student.className})
                                </span>
                              </button>
                              <Badge
                                variant={isHere ? 'secondary' : 'outline'}
                                className="text-[10px] shrink-0"
                                title={
                                  isHere
                                    ? t('distribution.card.inThisProject')
                                    : assignedProj
                                      ? t('distribution.card.currentlyIn', {
                                          name: assignedProj.name,
                                        })
                                      : t('distribution.card.unassigned')
                                }
                              >
                                {isHere
                                  ? t('distribution.card.hereMark')
                                  : assignedProj
                                    ? assignedProj.name
                                    : '—'}
                              </Badge>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </TooltipProvider>
    </section>
  );
}
