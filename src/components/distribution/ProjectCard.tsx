import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { StudentChip } from './StudentChip';
import type { Project, Student, Assignment } from '@/types';

type Props = {
  project: Project;
  students: { student: Student; assignment: Assignment }[];
};

export function ProjectCard({ project, students }: Props) {
  const { isOver, setNodeRef } = useDroppable({ id: project.id });
  const count = students.length;
  const pctTarget = project.targetCapacity > 0 ? Math.min(count / project.targetCapacity, 1) : 0;
  const overTarget = count > project.targetCapacity;
  const overMax = count > project.maxCapacity;

  let barColor = 'bg-yellow-500';
  if (overMax) barColor = 'bg-red-600';
  else if (overTarget) barColor = 'bg-blue-500';
  else if (count >= project.targetCapacity) barColor = 'bg-green-500';

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'border rounded-lg p-3 bg-card flex flex-col gap-2 transition-colors',
        isOver && 'border-primary ring-2 ring-primary/20',
      )}
    >
      <div>
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
      <div className="flex flex-wrap gap-1 min-h-[40px]">
        {students.map(({ student, assignment }) => (
          <StudentChip key={student.id} student={student} assignment={assignment} />
        ))}
      </div>
    </div>
  );
}
