import { useMemo, useState } from 'react';
import {
  DndContext, PointerSensor, useDroppable, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDistributionData } from '@/hooks/useDistributionData';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { useStudentsStore } from '@/store/useStudentsStore';
import { ProjectCard } from './ProjectCard';
import { StudentChip } from './StudentChip';
import { StudentFormDialog } from '@/components/students/StudentFormDialog';
import { toast } from 'sonner';
import type { Project, Student } from '@/types';
import type { BoardSortKey } from './boardSort';

const UNASSIGNED_ID = '__unassigned__';

function compareStr(a: string, b: string): number {
  return a.localeCompare(b, 'de', { sensitivity: 'base', numeric: true });
}

type Props = { sortKey: BoardSortKey };

export function BoardView({ sortKey }: Props) {
  const { rows, projects } = useDistributionData();
  const updateAssignment = useAssignmentsStore((s) => s.updateAssignment);
  const updateStudent = useStudentsStore((s) => s.updateStudent);
  const [editing, setEditing] = useState<Student | null>(null);

  // Distance constraint allows clicks (under 5px movement) without triggering drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const studentId = e.active.id as string;
    const targetId = e.over?.id as string | undefined;
    if (!targetId) return;
    const row = rows.find((r) => r.student.id === studentId);
    if (!row) return;
    const student = row.student;
    const currentProjectId = row.assignment?.projectId ?? null;

    if (targetId === UNASSIGNED_ID) {
      if (currentProjectId === null) return; // already unassigned — no-op
      updateAssignment(studentId, null, null);
      toast.success('Schüler entfernt aus Projekt');
      return;
    }

    if (targetId === currentProjectId) return; // dropped on same project — no-op

    const target = projects.find((p) => p.id === targetId);
    if (!target) return;
    if (!target.grades.includes(student.grade)) {
      toast.warning(`Jahrgang ${student.grade} passt nicht zu "${target.name}" (${target.grades.join(', ')})`);
      return;
    }
    const currentLoad = rows.filter(
      (r) => r.assignment?.projectId === targetId && r.student.id !== studentId,
    ).length;
    if (currentLoad >= target.maxCapacity) {
      toast.warning(`"${target.name}" ist voll (${currentLoad}/${target.maxCapacity})`);
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

  // Popularity score per project (Prio 1 = 5, Prio 5 = 1).
  const popularityById = useMemo(() => {
    const out = new Map<string, number>();
    for (const p of projects) out.set(p.id, 0);
    for (const r of rows) {
      r.student.priorities.forEach((pid, i) => {
        if (i >= 5) return;
        out.set(pid, (out.get(pid) ?? 0) + (5 - i));
      });
    }
    return out;
  }, [projects, rows]);

  const sortedProjects = useMemo(() => {
    const copy = [...projects];
    const loadOf = (p: Project) => byProject.get(p.id)?.length ?? 0;
    copy.sort((a, b) => {
      switch (sortKey) {
        case 'popularity':
          return (popularityById.get(b.id) ?? 0) - (popularityById.get(a.id) ?? 0) || compareStr(a.name, b.name);
        case 'name':
          return compareStr(a.name, b.name);
        case 'load':
          return loadOf(b) - loadOf(a) || compareStr(a.name, b.name);
        case 'utilization': {
          const ua = a.maxCapacity > 0 ? loadOf(a) / a.maxCapacity : 0;
          const ub = b.maxCapacity > 0 ? loadOf(b) / b.maxCapacity : 0;
          return ub - ua || compareStr(a.name, b.name);
        }
        case 'grade': {
          const ga = Math.min(...a.grades);
          const gb = Math.min(...b.grades);
          return ga - gb || compareStr(a.name, b.name);
        }
      }
    });
    return copy;
    // byProject not in deps because it's derived from rows; rows already triggers re-memo.
  }, [projects, rows, sortKey, popularityById]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedProjects.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            allProjects={projects}
            allRows={rows}
            students={(byProject.get(p.id) ?? [])
              .filter((r) => r.assignment)
              .map((r) => ({ student: r.student, assignment: r.assignment! }))}
            onStudentClick={(s) => setEditing(s)}
          />
        ))}
      </div>
      <UnassignedDroppable>
        {unassigned.map((r) => (
          <StudentChip
            key={r.student.id}
            student={r.student}
            assignment={r.assignment}
            projects={projects}
            onClick={() => setEditing(r.student)}
          />
        ))}
      </UnassignedDroppable>

      <StudentFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        initial={editing ?? undefined}
        onSave={(data) => {
          if (!editing) return;
          updateStudent(editing.id, data);
          toast.success('Schüler aktualisiert');
          setEditing(null);
        }}
      />
    </DndContext>
  );
}

function UnassignedDroppable({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: UNASSIGNED_ID });
  return (
    <div
      ref={setNodeRef}
      className={`mt-4 border-2 border-dashed rounded-lg p-3 bg-muted/30 ${isOver ? 'border-primary' : 'border-muted'}`}
    >
      <h3 className="text-sm font-medium mb-2">Unverteilt</h3>
      <div className="flex flex-wrap gap-1 min-h-[40px]">{children}</div>
    </div>
  );
}
