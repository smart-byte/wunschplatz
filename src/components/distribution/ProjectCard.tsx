import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { StudentChip } from './StudentChip';
import { Heart, Star, Target, Users } from 'lucide-react';
import type { Project, Student, Assignment } from '@/types';

type Row = { student: Student; assignment: Assignment | null };

type Props = {
  project: Project;
  students: { student: Student; assignment: Assignment }[];
  allProjects: Project[];
  allRows: Row[];
  onStudentClick?: (student: Student) => void;
};

export function ProjectCard({ project, students, allProjects, allRows, onStudentClick }: Props) {
  const { isOver, setNodeRef } = useDroppable({ id: project.id });
  const count = students.length;
  const pctTarget = project.targetCapacity > 0 ? Math.min(count / project.targetCapacity, 1) : 0;
  const overTarget = count > project.targetCapacity;
  const overMax = count > project.maxCapacity;

  let barColor = 'bg-yellow-500';
  if (overMax) barColor = 'bg-red-600';
  else if (overTarget) barColor = 'bg-blue-500';
  else if (count >= project.targetCapacity) barColor = 'bg-green-500';

  // Group all students who picked this project (any rank) by their rank.
  const interestedByRank = useMemo(() => {
    const out: Row[][] = [[], [], [], [], []]; // 5 ranks
    for (const r of allRows) {
      const idx = r.student.priorities.indexOf(project.id);
      if (idx >= 0 && idx < 5) out[idx].push(r);
    }
    return out;
  }, [allRows, project.id]);

  const totalInterested = interestedByRank.reduce((s, arr) => s + arr.length, 0);
  // Popularity score: prio 1 = 5 pts, prio 2 = 4 pts, ..., prio 5 = 1 pt.
  const popularityScore = interestedByRank.reduce(
    (s, arr, i) => s + arr.length * (5 - i),
    0,
  );

  // Compute scores for ALL projects (for the ranking list).
  const allScores = useMemo(() => {
    const scores = allProjects.map((p) => {
      let total = 0;
      for (const r of allRows) {
        const idx = r.student.priorities.indexOf(p.id);
        if (idx >= 0 && idx < 5) total += 5 - idx;
      }
      return { project: p, score: total };
    });
    scores.sort((a, b) => b.score - a.score);
    return scores;
  }, [allProjects, allRows]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'border rounded-lg p-3 bg-card flex flex-col gap-2 transition-colors',
        isOver && 'border-primary ring-2 ring-primary/20',
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{project.name}</h3>
          <p className="text-xs text-muted-foreground">Jg. {project.grades.join(', ')}</p>
        </div>
        <TooltipProvider delayDuration={150}>
          <div className="shrink-0 flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-1 rounded border bg-background text-xs tabular-nums"
                  aria-label={`${count} von ${project.maxCapacity} zugewiesen`}
                >
                  <Users className="size-3.5 text-muted-foreground" />
                  <span className="font-medium">{count}<span className="text-muted-foreground">/{project.maxCapacity}</span></span>
                </span>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                {count} von {project.maxCapacity} zugewiesen (Max-Kapazität)
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-1 rounded border bg-background text-xs tabular-nums"
                  aria-label={`Soll ${project.targetCapacity}`}
                >
                  <Target className="size-3.5 text-muted-foreground" />
                  <span className="font-medium">{project.targetCapacity}</span>
                </span>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                Soll-Kapazität: {project.targetCapacity}
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
      <div className="h-1.5 bg-muted rounded overflow-hidden">
        <div className={cn('h-full transition-all', barColor)} style={{ width: `${Math.min(100, (count / project.maxCapacity) * 100)}%` }} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground/60 tabular-nums">
          {Math.round(pctTarget * 100)}% Soll
        </span>
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 px-1.5 py-1 rounded border bg-background text-xs tabular-nums hover:bg-muted"
                title="Beliebtheits-Score anzeigen"
              >
                <Star className="size-3.5 text-amber-500 fill-amber-500" />
                <span className="font-medium">{popularityScore}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 max-h-[70vh] overflow-y-auto p-3 text-xs">
              <div className="font-medium text-sm">Beliebtheits-Score</div>
              <p className="text-muted-foreground mt-0.5">
                Punkte pro Prio-Rang aller Schüler, die dieses Projekt gewählt haben.
              </p>

              <div className="mt-3 rounded border bg-muted/30 p-2">
                <div className="text-muted-foreground mb-1">Berechnung für „{project.name}"</div>
                <table className="w-full text-xs tabular-nums">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="text-left font-normal">Rang</th>
                      <th className="text-right font-normal">Anzahl</th>
                      <th className="text-right font-normal">× Pkt</th>
                      <th className="text-right font-normal">= Summe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interestedByRank.map((arr, i) => {
                      const pts = 5 - i;
                      return (
                        <tr key={i}>
                          <td>Prio {i + 1}</td>
                          <td className="text-right">{arr.length}</td>
                          <td className="text-right text-muted-foreground">{pts}</td>
                          <td className="text-right">{arr.length * pts}</td>
                        </tr>
                      );
                    })}
                    <tr className="border-t font-medium">
                      <td colSpan={3} className="pt-1">Gesamt</td>
                      <td className="text-right pt-1">{popularityScore}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-3">
                <div className="font-medium mb-1">Alle Projekte nach Score</div>
                <ol className="space-y-0.5">
                  {allScores.map(({ project: p, score }, i) => {
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
                          <span className="text-muted-foreground tabular-nums w-5 text-right">{i + 1}.</span>
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
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 px-1.5 py-1 rounded border bg-background text-xs hover:bg-muted"
                title="Wer hat dieses Projekt gewählt?"
              >
                <Heart className="size-3.5 text-rose-500 fill-rose-500" />
                <span className="tabular-nums font-medium">{totalInterested}</span>
              </button>
            </PopoverTrigger>
          <PopoverContent align="end" className="w-80 max-h-[60vh] overflow-y-auto p-3">
            <div className="text-sm font-medium mb-1">Wer hat „{project.name}" gewählt?</div>
            <div className="text-xs text-muted-foreground mb-3">
              {totalInterested === 0
                ? 'Niemand hat dieses Projekt gewählt.'
                : `${totalInterested} Schüler insgesamt`}
            </div>
            <div className="space-y-3">
              {interestedByRank.map((rows, rank) => {
                if (rows.length === 0) return null;
                return (
                  <div key={rank}>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[10px]">Prio {rank + 1}</Badge>
                      <span className="text-xs text-muted-foreground">{rows.length}</span>
                    </div>
                    <ul className="space-y-1">
                      {rows.map((r) => {
                        const assignedProj = r.assignment?.projectId
                          ? allProjects.find((p) => p.id === r.assignment!.projectId)
                          : null;
                        const isHere = r.assignment?.projectId === project.id;
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
                              <span className="text-muted-foreground ml-1">({r.student.className})</span>
                            </button>
                            <Badge
                              variant={isHere ? 'secondary' : 'outline'}
                              className="text-[10px] shrink-0"
                              title={isHere ? 'In diesem Projekt' : assignedProj ? `Aktuell in: ${assignedProj.name}` : 'Unverteilt'}
                            >
                              {isHere ? '✓ hier' : assignedProj ? assignedProj.name : '—'}
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
      </div>
      <div className="flex flex-wrap gap-1 min-h-[40px]">
        {students.map(({ student, assignment }) => (
          <StudentChip
            key={student.id}
            student={student}
            assignment={assignment}
            projects={allProjects}
            onClick={() => onStudentClick?.(student)}
          />
        ))}
      </div>
    </div>
  );
}
