import { useState } from 'react';
import { writeFile } from 'xlsx';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ImportDialog, type ImportMode } from '@/components/students/ImportDialog';
import { StudentsTable } from '@/components/students/StudentsTable';
import { StudentFormDialog } from '@/components/students/StudentFormDialog';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { buildStudentsWorkbook } from '@/excel/exportStudents';
import { usePageFileDrop } from '@/hooks/usePageFileDrop';
import { toast } from 'sonner';
import { WorkspaceBackdrop } from '@/components/layout/WorkspaceBackdrop';
import { ClipboardCheck, Download, Plus, Trash2, Upload, Users } from 'lucide-react';

export default function StudentsPage() {
  const { t, i18n } = useTranslation('app');
  const students = useStudentsStore((s) => s.students);
  const projects = useProjectsStore((s) => s.projects);
  const addStudent = useStudentsStore((s) => s.addStudent);
  const removeAll = useStudentsStore((s) => s.removeAll);
  const clearAssignments = useAssignmentsStore((s) => s.clear);

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

  function handleExport() {
    const wb = buildStudentsWorkbook(students, projects, i18n.resolvedLanguage ?? i18n.language);
    const date = new Date().toISOString().slice(0, 10);
    writeFile(wb, `${t('students.exportFilePrefix')}-${date}.xlsx`);
    toast.success(t('students.exportStarted'));
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
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-7 border-b border-rule pb-6">
          <h1 className="page-title">{t('students.title', { count: students.length })}</h1>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4 mr-2" />
              {t('students.exportExcel')}
            </Button>
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
        <div className="bg-background">
          <StudentsTable />
        </div>
        <div className="mt-8 flex justify-end border-t pt-4">
          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              if (confirm(t('students.confirmDeleteAll'))) {
                removeAll();
                clearAssignments();
                toast.success(t('students.allDeleted'));
              }
            }}
          >
            <Trash2 className="size-4 mr-2" />
            {t('students.deleteAll')}
          </Button>
        </div>
      </div>
    </>
  );
}
