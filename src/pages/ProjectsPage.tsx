import { writeFile } from 'xlsx';
import { Button } from '@/components/ui/button';
import { ProjectFormDialog } from '@/components/projects/ProjectFormDialog';
import { ProjectImportDialog } from '@/components/projects/ProjectImportDialog';
import { ProjectsTable } from '@/components/projects/ProjectsTable';
import { SampleDataDialog } from '@/components/projects/SampleDataDialog';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { buildProjectsWorkbook } from '@/excel/exportProjects';
import { toast } from 'sonner';
import { Download, FolderPlus, Plus } from 'lucide-react';

export default function ProjectsPage() {
  const projects = useProjectsStore((s) => s.projects);
  const addProject = useProjectsStore((s) => s.addProject);
  const setProjects = useProjectsStore((s) => s.setProjects);
  const clearAssignments = useAssignmentsStore((s) => s.clear);

  function handleExport() {
    const wb = buildProjectsWorkbook(projects);
    const date = new Date().toISOString().slice(0, 10);
    writeFile(wb, `projekte-${date}.xlsx`);
    toast.success('Excel-Export gestartet');
  }

  const addProjectTrigger = (
    <ProjectFormDialog
      trigger={<Button><Plus className="size-4 mr-2" />Neues Projekt</Button>}
      onSave={(data) => {
        addProject(data);
        toast.success(`Projekt "${data.name}" angelegt`);
      }}
    />
  );

  if (projects.length === 0) {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <FolderPlus className="size-12 text-muted-foreground/40" />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Noch keine Projekte</h1>
          <p className="text-muted-foreground">
            Lege ein neues Projekt an, importiere aus Excel oder generiere
            Beispieldaten zum Testen.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <SampleDataDialog />
          <ProjectImportDialog />
          {addProjectTrigger}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projekte ({projects.length})</h1>
        <div className="flex gap-2">
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
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4 mr-2" />
            Excel exportieren
          </Button>
          <SampleDataDialog />
          <ProjectImportDialog />
          {addProjectTrigger}
        </div>
      </div>
      <ProjectsTable />
    </div>
  );
}
