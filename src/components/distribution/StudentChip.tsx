import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type { Student, Assignment, Project } from '@/types';
import { AssignmentBadge } from './AssignmentBadge';

type Props = {
  student: Student;
  assignment: Assignment | null;
  projects: Project[];
  onClick?: () => void;
};

export function StudentChip({ student, assignment, projects, onClick }: Props) {
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
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-2 py-1 rounded border bg-background text-xs cursor-pointer',
        isDragging && 'opacity-50',
        assignment?.manuallyEdited && 'border-dashed',
      )}
    >
      <span className="truncate max-w-[120px]">{student.lastName}, {student.firstName.charAt(0)}.</span>
      <span className="text-muted-foreground">{student.className}</span>
      <AssignmentBadge
        student={student}
        assignment={assignment}
        projects={projects}
        size="xs"
        disableTooltip={isDragging}
      />
    </div>
  );
}
