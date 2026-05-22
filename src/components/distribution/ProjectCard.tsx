import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { StudentChip } from './StudentChip';
import { Users } from 'lucide-react';
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
          <p className="text-xs text-muted-foreground">
            Jg. {project.grades.join(', ')} · {count}/{project.maxCapacity} (Soll {project.targetCapacity})
          </p>
          <div className="h-1.5 bg-muted rounded mt-1 overflow-hidden">
            <div className={cn('h-full transition-all', barColor)} style={{ width: `${Math.min(100, (count / project.maxCapacity) * 100)}%` }} />
          </div>
          <div className="text-xs text-muted-foreground/60 mt-0.5 tabular-nums">
            {Math.round(pctTarget * 100)}% Soll
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1">
          <span
            className="inline-flex items-center gap-0.5 px-1.5 py-1 rounded border bg-background text-xs tabular-nums"
            title={`Beliebtheits-Score: ${popularityScore} (Prio 1 = 5 Pkt, Prio 2 = 4, …, Prio 5 = 1)`}
          >
            <span className="text-muted-foreground">★</span>
            <span className="font-medium">{popularityScore}</span>
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 px-1.5 py-1 rounded border bg-background text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Interessenten anzeigen"
              >
                <Users className="size-3.5" />
                <span className="tabular-nums">{totalInterested}</span>
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
