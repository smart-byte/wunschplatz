import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { StudentFormDialog } from './StudentFormDialog';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function StudentsTable() {
  const students = useStudentsStore((s) => s.students);
  const updateStudent = useStudentsStore((s) => s.updateStudent);
  const removeStudent = useStudentsStore((s) => s.removeStudent);
  const projects = useProjectsStore((s) => s.projects);
  const clearAssignments = useAssignmentsStore((s) => s.clear);
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? '?';

  if (students.length === 0) {
    return <p className="text-muted-foreground">Noch keine Schüler. Importiere Excel-Datei oder lege einen neuen Schüler an.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Klasse</TableHead>
            <TableHead>Jg.</TableHead>
            <TableHead>Prio 1</TableHead>
            <TableHead>Prio 2</TableHead>
            <TableHead>Prio 3</TableHead>
            <TableHead>Prio 4</TableHead>
            <TableHead>Prio 5</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.lastName}, {s.firstName}</TableCell>
              <TableCell>{s.className}</TableCell>
              <TableCell>{s.grade}</TableCell>
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
                    toast.success('Schüler aktualisiert');
                  }}
                />
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
