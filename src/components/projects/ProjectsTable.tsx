import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useProjectsStore } from '@/store/useProjectsStore';
import { commitProjects } from '@/store/commitProjects';
import { ProjectFormDialog } from './ProjectFormDialog';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatGrades } from '@/lib/utils';
import type { Project } from '@/types';

export function ProjectsTable() {
  const { t } = useTranslation('app');
  const projects = useProjectsStore((s) => s.projects);
  const updateProject = useProjectsStore((s) => s.updateProject);
  // One shared dialog outlives its row, so a project deleted in another tab reports that on
  // save instead of closing the dialog and dropping the edits.
  const [editing, setEditing] = useState<Project | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  if (projects.length === 0) {
    return <p className="text-muted-foreground">{t('projects.table.empty')}</p>;
  }

  return (
    <>
      <ProjectFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={editing ?? undefined}
        onSave={(data) => editing && updateProject(editing.id, data)}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('projects.table.name')}</TableHead>
            <TableHead>{t('projects.table.grades')}</TableHead>
            <TableHead>{t('projects.table.target')}</TableHead>
            <TableHead>{t('projects.table.max')}</TableHead>
            <TableHead>{t('projects.table.description')}</TableHead>
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
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('common.editNamed', { name: p.name })}
                  onClick={() => {
                    setEditing(p);
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('common.deleteNamed', { name: p.name })}
                  onClick={() => {
                    if (
                      confirm(
                        t('projects.table.confirmDelete', { name: p.name }) +
                          '\n\n' +
                          t('projects.removalEffects'),
                      )
                    ) {
                      commitProjects(projects.filter((project) => project.id !== p.id));
                      toast.success(t('projects.table.deleted', { name: p.name }));
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
    </>
  );
}
