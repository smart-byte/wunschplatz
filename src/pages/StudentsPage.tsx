import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ImportDialog, type ImportMode } from '@/components/students/ImportDialog';
import { StudentsTable } from '@/components/students/StudentsTable';
import { StudentFormDialog } from '@/components/students/StudentFormDialog';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { useRoundsStore } from '@/store/useRoundsStore';
import { usePageFileDrop } from '@/hooks/usePageFileDrop';
import { toast } from 'sonner';
import { toastFailure } from '@/lib/toastFailure';
import { WorkspaceBackdrop } from '@/components/layout/WorkspaceBackdrop';
import { PageHeader } from '@/components/layout/PageHeader';
import { NextStep } from '@/components/layout/NextStep';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ClipboardCheck,
  Download,
  MoreHorizontal,
  Plus,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';

export default function StudentsPage() {
  const { t, i18n } = useTranslation('app');
  const students = useStudentsStore((s) => s.students);
  const projects = useProjectsStore((s) => s.projects);
  const addStudent = useStudentsStore((s) => s.addStudent);
  const removeAll = useStudentsStore((s) => s.removeAll);
  const clearAssignments = useAssignmentsStore((s) => s.clear);
  // Form results need the round's form template; without one, Excel is the useful default.
  const hasFormTemplate = useRoundsStore((s) => {
    const round = s.rounds.find((r) => r.id === s.activeRoundId);
    return !!(round?.blueprint || round?.blueprintHistory?.length);
  });

  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('excel');
  const { isDragging } = usePageFileDrop((file) => {
    setImportMode('excel');
    setImportFile(file);
    setImportOpen(true);
  });

  function openImport(mode: ImportMode) {
    setImportMode(mode);
    setImportFile(null);
    setImportOpen(true);
  }

  async function handleExport() {
    try {
      // SheetJS is large; load it only when someone actually exports.
      const [{ writeFile }, { buildStudentsWorkbook }] = await Promise.all([
        import('xlsx'),
        import('@/excel/exportStudents'),
      ]);
      const wb = buildStudentsWorkbook(students, projects, i18n.resolvedLanguage ?? i18n.language);
      const date = new Date().toISOString().slice(0, 10);
      writeFile(wb, `${t('students.exportFilePrefix')}-${date}.xlsx`);
      toast.success(t('students.exportStarted'));
    } catch (error) {
      toastFailure(error, t('common.exportFailed'));
    }
  }

  const importDialog = (
    <ImportDialog
      key={importMode}
      open={importOpen}
      onOpenChange={(o) => {
        setImportOpen(o);
        if (!o) setImportFile(null);
      }}
      externalFile={importFile}
      defaultMode={importMode}
    />
  );

  const dragOverlay = isDragging && (
    <div className="fixed inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
      <div className="rounded-lg border-2 border-dashed border-primary bg-card p-6 text-center shadow-lg">
        <Upload className="size-8 text-primary mx-auto mb-2" />
        <p className="font-medium">{t('students.dropTitle')}</p>
        <p className="text-xs text-muted-foreground mt-1">{t('students.dropHint')}</p>
      </div>
    </div>
  );

  const addStudentTrigger = (
    <StudentFormDialog
      trigger={
        <Button>
          <Plus className="size-4 mr-2" />
          {t('students.newStudent')}
        </Button>
      }
      onSave={(data) => {
        addStudent(data);
        toast.success(t('students.created', { name: `${data.firstName} ${data.lastName}` }));
      }}
    />
  );

  if (students.length === 0) {
    return (
      <>
        <WorkspaceBackdrop page="students" state="empty" />
        {dragOverlay}
        {importDialog}
        <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
          <Users className="size-10 text-mark/60" />
          <div className="space-y-1">
            <h1 className="page-title">{t('students.emptyTitle')}</h1>
            <p className="text-muted-foreground">{t('students.emptyDescription')}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => openImport('forms')}>
              <ClipboardCheck className="size-4 mr-2" />
              {t('students.importFormResults')}
            </Button>
            <Button variant="outline" onClick={() => openImport('excel')}>
              <Upload className="size-4 mr-2" />
              {t('students.importExcel')}
            </Button>
            {addStudentTrigger}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <WorkspaceBackdrop page="students" state="filled" />
      {dragOverlay}
      {importDialog}
      <PageHeader
        title={t('students.title', { count: students.length })}
        description={t('students.description')}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => openImport(hasFormTemplate ? 'forms' : 'excel')}
            >
              <Upload />
              {t('students.import')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={t('common.moreActions')}
                  title={t('common.moreActions')}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={handleExport}>
                  <Download className="size-4 mr-2" />
                  {t('students.exportExcel')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => {
                    if (confirm(t('students.confirmDeleteAll'))) {
                      removeAll();
                      clearAssignments();
                      toast.success(t('students.allDeleted'));
                    }
                  }}
                >
                  <Trash2 className="size-4 mr-2" />
                  {t('students.deleteAll')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {addStudentTrigger}
          </>
        }
      />
      <div className="bg-background">
        <StudentsTable />
      </div>
      <NextStep to="/optimize" label={t('nav.next.optimize')} />
    </>
  );
}
