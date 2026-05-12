import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useProjectsStore } from '@/store/useProjectsStore';

export function StudentsTable() {
  const students = useStudentsStore((s) => s.students);
  const projects = useProjectsStore((s) => s.projects);
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? '?';

  if (students.length === 0) {
    return <p className="text-muted-foreground">Noch keine Schüler. Importiere Excel-Datei.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Klasse</TableHead>
            <TableHead>Jahrgang</TableHead>
            <TableHead>Prio 1</TableHead>
            <TableHead>Prio 2</TableHead>
            <TableHead>Prio 3</TableHead>
            <TableHead>Prio 4</TableHead>
            <TableHead>Prio 5</TableHead>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
