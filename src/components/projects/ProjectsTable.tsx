import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { ProjectFormDialog } from './ProjectFormDialog';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatGrades } from '@/lib/utils';

export function ProjectsTable() {
  const projects = useProjectsStore((s) => s.projects);
  const updateProject = useProjectsStore((s) => s.updateProject);
  const removeProject = useProjectsStore((s) => s.removeProject);
  const clearAssignments = useAssignmentsStore((s) => s.clear);

  if (projects.length === 0) {
    return <p className="text-muted-foreground">Noch keine Projekte. Lege das erste an.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Jahrgänge</TableHead>
          <TableHead>Soll</TableHead>
          <TableHead>Max</TableHead>
          <TableHead>Beschreibung</TableHead>
          <TableHead className="w-[120px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">{p.name}</TableCell>
            <TableCell>{formatGrades(p.grades)}</TableCell>
            <TableCell>{p.targetCapacity}</TableCell>
            <TableCell>{p.maxCapacity}</TableCell>
            <TableCell className="text-muted-foreground">{p.description ?? '—'}</TableCell>
            <TableCell className="flex gap-1">
              <ProjectFormDialog
                trigger={<Button variant="ghost" size="icon"><Pencil className="size-4" /></Button>}
                initial={p}
                onSave={(data) => updateProject(p.id, data)}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm(`Projekt "${p.name}" löschen? Zuweisungen darauf werden zurückgesetzt.`)) {
                    removeProject(p.id);
                    clearAssignments();
                    toast.success(`Projekt "${p.name}" gelöscht`);
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
  );
}
