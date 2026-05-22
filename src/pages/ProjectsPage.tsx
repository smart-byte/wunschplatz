import { useState } from 'react';
import { writeFile } from 'xlsx';
import { Button } from '@/components/ui/button';
import { ProjectFormDialog } from '@/components/projects/ProjectFormDialog';
import { ProjectImportDialog } from '@/components/projects/ProjectImportDialog';
import { ProjectsTable } from '@/components/projects/ProjectsTable';
import { SampleDataDialog } from '@/components/projects/SampleDataDialog';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { buildProjectsWorkbook } from '@/excel/exportProjects';
import { usePageFileDrop } from '@/hooks/usePageFileDrop';
import { toast } from 'sonner';
import { Download, FolderPlus, Plus, Upload } from 'lucide-react';

export default function ProjectsPage() {
  const projects = useProjectsStore((s) => s.projects);
  const addProject = useProjectsStore((s) => s.addProject);
  const setProjects = useProjectsStore((s) => s.setProjects);
  const clearAssignments = useAssignmentsStore((s) => s.clear);

  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const { isDragging } = usePageFileDrop((file) => {
    setImportFile(file);
    setImportOpen(true);
  });

  function handleExport() {
    const wb = buildProjectsWorkbook(projects);
    const date = new Date().toISOString().slice(0, 10);
    writeFile(wb, `projekte-${date}.xlsx`);
    toast.success('Excel-Export gestartet');
  }

  const importDialog = (
    <ProjectImportDialog
      open={importOpen}
      onOpenChange={(o) => {
        setImportOpen(o);
        if (!o) setImportFile(null);
      }}
      externalFile={importFile}
    />
  );

  const dragOverlay = isDragging && (
    <div className="fixed inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
      <div className="rounded-lg border-2 border-dashed border-primary bg-card p-6 text-center shadow-lg">
        <Upload className="size-8 text-primary mx-auto mb-2" />
        <p className="font-medium">Excel-Datei zum Importieren ablegen</p>
        <p className="text-xs text-muted-foreground mt-1">.xlsx · .xls · .csv</p>
      </div>
    </div>
  );

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
      <>
        {dragOverlay}
        {importDialog}
        <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
          <FolderPlus className="size-12 text-muted-foreground/40" />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Noch keine Projekte</h1>
            <p className="text-muted-foreground">
              Lege ein neues Projekt an, importiere aus Excel (auch per Drag &amp; Drop)
              oder generiere Beispieldaten zum Testen.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <SampleDataDialog />
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="size-4 mr-2" />
              Excel importieren
            </Button>
            {addProjectTrigger}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {dragOverlay}
      {importDialog}
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
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="size-4 mr-2" />
              Excel importieren
            </Button>
            {addProjectTrigger}
          </div>
        </div>
        <ProjectsTable />
      </div>
    </>
  );
}
