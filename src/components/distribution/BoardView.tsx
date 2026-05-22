import { DndContext, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import { useDistributionData } from '@/hooks/useDistributionData';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { ProjectCard } from './ProjectCard';
import { StudentChip } from './StudentChip';
import { toast } from 'sonner';

const UNASSIGNED_ID = '__unassigned__';

export function BoardView() {
  const { rows, projects } = useDistributionData();
  const updateAssignment = useAssignmentsStore((s) => s.updateAssignment);

  function handleDragEnd(e: DragEndEvent) {
    const studentId = e.active.id as string;
    const targetId = e.over?.id as string | undefined;
    if (!targetId) return;
    const student = rows.find((r) => r.student.id === studentId)?.student;
    if (!student) return;

    if (targetId === UNASSIGNED_ID) {
      updateAssignment(studentId, null, null);
      toast.success('Schüler entfernt aus Projekt');
      return;
    }

    const target = projects.find((p) => p.id === targetId);
    if (!target) return;
    if (!target.grades.includes(student.grade)) {
      toast.error(`Jahrgang ${student.grade} passt nicht zu "${target.name}" (${target.grades.join(', ')})`);
      return;
    }
    const currentLoad = rows.filter(
      (r) => r.assignment?.projectId === targetId && r.student.id !== studentId,
    ).length;
    if (currentLoad >= target.maxCapacity) {
      toast.error(`"${target.name}" ist voll (${currentLoad}/${target.maxCapacity})`);
      return;
    }
    const idx = student.priorities.indexOf(targetId);
    const priorityRank = idx >= 0 && idx < 5 ? idx + 1 : null;
    updateAssignment(studentId, targetId, priorityRank);
    toast.success(`Verschoben zu "${target.name}"`);
  }

  const byProject = new Map<string, typeof rows>();
  for (const r of rows) {
    if (!r.assignment?.projectId) continue;
    const id = r.assignment.projectId;
    if (!byProject.has(id)) byProject.set(id, []);
    byProject.get(id)!.push(r);
  }
  const unassigned = rows.filter((r) => !r.assignment?.projectId);

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {projects.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            students={(byProject.get(p.id) ?? [])
              .filter((r) => r.assignment)
              .map((r) => ({ student: r.student, assignment: r.assignment! }))}
          />
        ))}
      </div>
      <UnassignedDroppable>
        {unassigned.map((r) => (
          <StudentChip key={r.student.id} student={r.student} assignment={r.assignment} />
        ))}
      </UnassignedDroppable>
    </DndContext>
  );
}

function UnassignedDroppable({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: UNASSIGNED_ID });
  return (
    <div
      ref={setNodeRef}
      className={`mt-4 border-2 border-dashed rounded-lg p-3 bg-muted/30 ${isOver ? 'border-destructive' : 'border-muted'}`}
    >
      <h3 className="text-sm font-medium mb-2">Unverteilt</h3>
      <div className="flex flex-wrap gap-1 min-h-[40px]">{children}</div>
    </div>
  );
}
