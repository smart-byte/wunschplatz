import { useDraggable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Student, Assignment } from '@/types';

type Props = { student: Student; assignment: Assignment | null };

export function StudentChip({ student, assignment }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: student.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center gap-2 px-2 py-1 rounded border bg-background text-xs cursor-grab',
        isDragging && 'opacity-50',
        assignment?.manuallyEdited && 'border-dashed',
      )}
    >
      <span className="truncate max-w-[120px]">{student.lastName}, {student.firstName.charAt(0)}.</span>
      <span className="text-muted-foreground">{student.className}</span>
      {assignment?.priorityRank ? (
        <Badge variant="secondary" className="text-[10px] py-0 px-1">P{assignment.priorityRank}</Badge>
      ) : assignment?.projectId === null ? (
        <Badge variant="destructive" className="text-[10px] py-0 px-1">—</Badge>
      ) : (
        <Badge variant="outline" className="text-[10px] py-0 px-1">außer</Badge>
      )}
    </div>
  );
}
