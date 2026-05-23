import { useState } from 'react';
import { writeFile } from 'xlsx';
import { Button } from '@/components/ui/button';
import { ImportDialog } from '@/components/students/ImportDialog';
import { StudentsTable } from '@/components/students/StudentsTable';
import { StudentFormDialog } from '@/components/students/StudentFormDialog';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { buildStudentsWorkbook } from '@/excel/exportStudents';
import { usePageFileDrop } from '@/hooks/usePageFileDrop';
import { toast } from 'sonner';
import { Download, Plus, Upload, Users } from 'lucide-react';

export default function StudentsPage() {
  const students = useStudentsStore((s) => s.students);
  const projects = useProjectsStore((s) => s.projects);
  const addStudent = useStudentsStore((s) => s.addStudent);
  const removeAll = useStudentsStore((s) => s.removeAll);
  const clearAssignments = useAssignmentsStore((s) => s.clear);

  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const { isDragging } = usePageFileDrop((file) => {
    setImportFile(file);
    setImportOpen(true);
  });

  function handleExport() {
    const wb = buildStudentsWorkbook(students, projects);
    const date = new Date().toISOString().slice(0, 10);
    writeFile(wb, `schueler-${date}.xlsx`);
    toast.success('Excel-Export gestartet');
  }

  const importDialog = (
    <ImportDialog
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

  const addStudentTrigger = (
    <StudentFormDialog
      trigger={
        <Button>
          <Plus className="size-4 mr-2" />
          Neuer Schüler
        </Button>
      }
      onSave={(data) => {
        addStudent(data);
        toast.success(`Schüler "${data.firstName} ${data.lastName}" angelegt`);
      }}
    />
  );

  if (students.length === 0) {
    return (
      <>
        {dragOverlay}
        {importDialog}
        <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
          <Users className="size-12 text-muted-foreground/40" />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Noch keine Schüler</h1>
            <p className="text-muted-foreground">
              Importiere Schüler-Daten aus einer Excel-Datei (auch per Drag &amp; Drop)
              oder lege einen Schüler manuell an.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="size-4 mr-2" />
              Excel importieren
            </Button>
            {addStudentTrigger}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {dragOverlay}
      {importDialog}
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Schüler ({students.length})</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('Alle Schüler löschen?')) {
                  removeAll();
                  clearAssignments();
                  toast.success('Alle Schüler gelöscht');
                }
              }}
            >
              Alle löschen
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4 mr-2" />
              Excel exportieren
            </Button>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="size-4 mr-2" />
              Excel importieren
            </Button>
            {addStudentTrigger}
          </div>
        </div>
        <StudentsTable />
      </div>
    </>
  );
}
