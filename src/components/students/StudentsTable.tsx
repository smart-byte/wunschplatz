import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { StudentFormDialog } from './StudentFormDialog';
import { Pencil, Trash2, Users, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { getGroupColor } from '@/lib/groups';
import { MAX_GROUP_SIZE } from '@/types';
import { cn } from '@/lib/utils';

export function StudentsTable() {
  const students = useStudentsStore((s) => s.students);
  const updateStudent = useStudentsStore((s) => s.updateStudent);
  const removeStudent = useStudentsStore((s) => s.removeStudent);
  const createGroup = useStudentsStore((s) => s.createGroup);
  const removeFromGroup = useStudentsStore((s) => s.removeFromGroup);
  const projects = useProjectsStore((s) => s.projects);
  const clearAssignments = useAssignmentsStore((s) => s.clear);
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? '?';

  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function handleCreateGroup() {
    const ids = [...selected];
    const result = createGroup(ids);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    clearAssignments();
    clearSelection();
    toast.success(`Gruppe mit ${ids.length} Schülern gebildet`);
  }

  // Pre-validate the "Gruppe bilden" button state
  const selectedStudents = students.filter((s) => selected.has(s.id));
  const canForm = (() => {
    if (selectedStudents.length < 2 || selectedStudents.length > MAX_GROUP_SIZE) return null;
    if (selectedStudents.some((s) => s.groupId)) return 'Schüler bereits in Gruppe';
    const grade = selectedStudents[0].grade;
    if (selectedStudents.some((s) => s.grade !== grade)) return 'Jahrgang muss übereinstimmen';
    return 'ok';
  })();

  if (students.length === 0) {
    return <p className="text-muted-foreground">Noch keine Schüler. Importiere Excel-Datei oder lege einen neuen Schüler an.</p>;
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="flex items-center gap-3 border rounded-lg p-3 bg-card">
          <span className="text-sm">{selected.size} ausgewählt</span>
          <Button
            size="sm"
            disabled={canForm !== 'ok'}
            onClick={handleCreateGroup}
          >
            <Users className="size-4 mr-2" />
            Gruppe bilden
          </Button>
          {canForm && canForm !== 'ok' && (
            <span className="text-xs text-muted-foreground">{canForm}</span>
          )}
          {canForm === null && selectedStudents.length > MAX_GROUP_SIZE && (
            <span className="text-xs text-muted-foreground">Max. {MAX_GROUP_SIZE} pro Gruppe</span>
          )}
          <Button size="sm" variant="ghost" onClick={clearSelection}>Auswahl löschen</Button>
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Klasse</TableHead>
              <TableHead>Jg.</TableHead>
              <TableHead>Gruppe</TableHead>
              <TableHead>Prio 1</TableHead>
              <TableHead>Prio 2</TableHead>
              <TableHead>Prio 3</TableHead>
              <TableHead>Prio 4</TableHead>
              <TableHead>Prio 5</TableHead>
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => {
              const color = s.groupId ? getGroupColor(s.groupId) : null;
              return (
                <TableRow
                  key={s.id}
                  className={cn(color && 'border-l-4', color?.ring.replace('ring-', 'border-l-'))}
                >
                  <TableCell>
                    <Checkbox
                      checked={selected.has(s.id)}
                      onCheckedChange={() => toggle(s.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{s.lastName}, {s.firstName}</TableCell>
                  <TableCell>{s.className}</TableCell>
                  <TableCell>{s.grade}</TableCell>
                  <TableCell>
                    {color ? (
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs', color.bg, color.text)}>
                        <Users className="size-3" />
                        {color.label}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <TableCell key={i} className="text-sm">
                      {s.priorities[i] ? projectName(s.priorities[i]) : '—'}
                    </TableCell>
                  ))}
                  <TableCell className="flex gap-1">
                    <StudentFormDialog
                      trigger={<Button variant="ghost" size="icon"><Pencil className="size-4" /></Button>}
                      initial={s}
                      onSave={(data) => {
                        updateStudent(s.id, data);
                        clearAssignments();
                        toast.success(s.groupId ? 'Schüler + Gruppe aktualisiert' : 'Schüler aktualisiert');
                      }}
                    />
                    {s.groupId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Aus Gruppe entfernen"
                        onClick={() => {
                          removeFromGroup(s.id);
                          clearAssignments();
                          toast.success('Aus Gruppe entfernt');
                        }}
                      >
                        <UserMinus className="size-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`${s.firstName} ${s.lastName} löschen?`)) {
                          removeStudent(s.id);
                          clearAssignments();
                          toast.success('Schüler gelöscht');
                        }
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
