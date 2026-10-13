import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ProjectFormDialog } from '@/components/projects/ProjectFormDialog';
import { ProjectImportDialog } from '@/components/projects/ProjectImportDialog';
import { ProjectsTable } from '@/components/projects/ProjectsTable';
import { SampleDataDialog } from '@/components/projects/SampleDataDialog';
import { BlueprintPanel } from '@/components/rounds/BlueprintPanel';
import { useProjectsStore } from '@/store/useProjectsStore';
import { commitProjects } from '@/store/commitProjects';
import { usePageFileDrop } from '@/hooks/usePageFileDrop';
import { toast } from 'sonner';
import { WorkspaceBackdrop } from '@/components/layout/WorkspaceBackdrop';
import { Download, FolderPlus, Plus, Trash2, Upload } from 'lucide-react';

export default function ProjectsPage() {
  const { t, i18n } = useTranslation('app');
  const projects = useProjectsStore((s) => s.projects);
  const addProject = useProjectsStore((s) => s.addProject);

  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const { isDragging } = usePageFileDrop((file) => {
    setImportFile(file);
    setImportOpen(true);
  });

  async function handleExport() {
    try {
      // SheetJS is large; load it only when someone actually exports.
      const [{ writeFile }, { buildProjectsWorkbook }] = await Promise.all([
        import('xlsx'),
        import('@/excel/exportProjects'),
      ]);
      const wb = buildProjectsWorkbook(projects, i18n.resolvedLanguage ?? i18n.language);
      const date = new Date().toISOString().slice(0, 10);
      writeFile(wb, `${t('projects.exportFilePrefix')}-${date}.xlsx`);
      toast.success(t('projects.exportStarted'));
    } catch {
      toast.error(t('common.exportFailed'));
    }
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
        <p className="font-medium">{t('projects.dropTitle')}</p>
        <p className="text-xs text-muted-foreground mt-1">{t('projects.dropHint')}</p>
      </div>
    </div>
  );

  const addProjectTrigger = (
    <ProjectFormDialog
      trigger={
        <Button>
          <Plus className="size-4 mr-2" />
          {t('projects.newProject')}
        </Button>
      }
      onSave={(data) => {
        addProject(data);
        toast.success(t('projects.created', { name: data.name }));
      }}
    />
  );

  if (projects.length === 0) {
    return (
      <>
        <WorkspaceBackdrop page="projects" state="empty" />
        {dragOverlay}
        {importDialog}
        <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
          <FolderPlus className="size-10 text-mark/60" />
          <div className="space-y-1">
            <h1 className="page-title">{t('projects.emptyTitle')}</h1>
            <p className="text-muted-foreground">{t('projects.emptyDescription')}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <SampleDataDialog />
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="size-4 mr-2" />
              {t('projects.importExcel')}
            </Button>
            {addProjectTrigger}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <WorkspaceBackdrop page="projects" state="filled" />
      {dragOverlay}
      {importDialog}
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-7 border-b border-rule pb-6">
          <h1 className="page-title">{t('projects.title', { count: projects.length })}</h1>
          <div className="flex flex-wrap justify-end gap-2">
            <SampleDataDialog />
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="size-4 mr-2" />
              {t('projects.importExcel')}
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4 mr-2" />
              {t('projects.exportExcel')}
            </Button>
            {addProjectTrigger}
          </div>
        </div>
        <div className="mb-6">
          <BlueprintPanel />
        </div>
        <div className="bg-background">
          <ProjectsTable />
        </div>
        <div className="mt-8 flex justify-end border-t pt-4">
          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              if (confirm(t('projects.confirmDeleteAll') + '\n\n' + t('projects.removalEffects'))) {
                commitProjects([]);
                toast.success(t('projects.allDeleted'));
              }
            }}
          >
            <Trash2 className="size-4 mr-2" />
            {t('projects.deleteAll')}
          </Button>
        </div>
      </div>
    </>
  );
}
