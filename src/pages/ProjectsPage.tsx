import { Button } from '@/components/ui/button';
import { ProjectFormDialog } from '@/components/projects/ProjectFormDialog';
import { ProjectImportDialog } from '@/components/projects/ProjectImportDialog';
import { ProjectsTable } from '@/components/projects/ProjectsTable';
import { SampleDataDialog } from '@/components/projects/SampleDataDialog';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

export default function ProjectsPage() {
  const projects = useProjectsStore((s) => s.projects);
  const addProject = useProjectsStore((s) => s.addProject);
  const setProjects = useProjectsStore((s) => s.setProjects);
  const clearAssignments = useAssignmentsStore((s) => s.clear);
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projekte ({projects.length})</h1>
        <div className="flex gap-2">
          {projects.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('Alle Projekte löschen? Verteilungen werden zurückgesetzt.')) {
                  setProjects([]);
                  clearAssignments();
                  toast.success('Alle Projekte gelöscht');
                }
              }}
            >
              Alle löschen
            </Button>
          )}
          <SampleDataDialog />
          <ProjectImportDialog />
          <ProjectFormDialog
            trigger={<Button><Plus className="size-4 mr-2" />Neues Projekt</Button>}
            onSave={(data) => {
              addProject(data);
              toast.success(`Projekt "${data.name}" angelegt`);
            }}
          />
        </div>
      </div>
      <ProjectsTable />
    </div>
  );
}
