import { Button } from '@/components/ui/button';
import { ImportDialog } from '@/components/students/ImportDialog';
import { StudentsTable } from '@/components/students/StudentsTable';
import { StudentFormDialog } from '@/components/students/StudentFormDialog';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

export default function StudentsPage() {
  const students = useStudentsStore((s) => s.students);
  const addStudent = useStudentsStore((s) => s.addStudent);
  const removeAll = useStudentsStore((s) => s.removeAll);
  const clearAssignments = useAssignmentsStore((s) => s.clear);
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Schüler ({students.length})</h1>
        <div className="flex gap-2">
          {students.length > 0 && (
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
          )}
          <StudentFormDialog
            trigger={
              <Button variant="outline">
                <Plus className="size-4 mr-2" />
                Neuer Schüler
              </Button>
            }
            onSave={(data) => {
              addStudent(data);
              clearAssignments();
              toast.success(`Schüler "${data.firstName} ${data.lastName}" angelegt`);
            }}
          />
          <ImportDialog />
        </div>
      </div>
      <StudentsTable />
    </div>
  );
}
