import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type { Student, Assignment, Project } from '@/types';
import { AssignmentBadge } from './AssignmentBadge';

type Props = {
  student: Student;
  assignment: Assignment;
  projects: Project[];
  onClick?: () => void;
};

export function StudentChip({ student, assignment, projects, onClick }: Props) {
  const { listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: student.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      {...listeners}
      aria-label={`${student.firstName} ${student.lastName}, ${student.className}`}
      onClick={onClick}
      className={cn(
        'relative flex min-h-9 w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs transition-colors hover:bg-mark/[0.04] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isDragging && 'z-20 bg-white shadow-md ring-1 ring-mark/30',
        assignment.manuallyEdited && 'border-l-2 border-dashed border-mark/40',
      )}
    >
      <span className="min-w-0 flex-1 truncate text-prose">
        {student.lastName}, {student.firstName}
      </span>
      <span className="shrink-0 text-prose-soft">{student.className}</span>
      <AssignmentBadge
        student={student}
        assignment={assignment}
        projects={projects}
        size="xs"
        disableTooltip={isDragging}
      />
    </button>
  );
}
