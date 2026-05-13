import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import {
  generateSampleProjects,
  generateSampleStudents,
  MAX_SAMPLE_PROJECTS,
} from '@/lib/sampleData';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';

export function SampleDataDialog() {
  const [open, setOpen] = useState(false);
  const [projectCount, setProjectCount] = useState(10);
  const [studentCount, setStudentCount] = useState(200);
  const setProjects = useProjectsStore((s) => s.setProjects);
  const setStudents = useStudentsStore((s) => s.setStudents);
  const clearAssignments = useAssignmentsStore((s) => s.clear);

  const existingProjects = useProjectsStore((s) => s.projects.length);
  const existingStudents = useStudentsStore((s) => s.students.length);
  const willReplace = existingProjects > 0 || existingStudents > 0;

  function handleGenerate() {
    const projects = generateSampleProjects(projectCount);
    const students = generateSampleStudents(studentCount, projects);
    setProjects(projects);
    setStudents(students);
    clearAssignments();
    toast.success(`${projects.length} Projekte und ${students.length} Schüler generiert`);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Sparkles className="size-4 mr-2" />
          Beispieldaten
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Beispieldaten generieren</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            Erstellt zufällige Projekte mit realistischen Namen, Jahrgangsstufen und Beschreibungen,
            sowie Schüler mit zufälligen, jahrgangs-passenden Prioritäten — schnell zum Ausprobieren.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="projectCount">Anzahl Projekte</Label>
              <Input
                id="projectCount"
                type="number"
                min={1}
                max={MAX_SAMPLE_PROJECTS}
                value={projectCount}
                onChange={(e) => setProjectCount(parseInt(e.target.value, 10) || 1)}
              />
              <p className="text-xs text-muted-foreground">Max. {MAX_SAMPLE_PROJECTS}</p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="studentCount">Anzahl Schüler</Label>
              <Input
                id="studentCount"
                type="number"
                min={1}
                max={5000}
                value={studentCount}
                onChange={(e) => setStudentCount(parseInt(e.target.value, 10) || 1)}
              />
            </div>
          </div>
          {willReplace && (
            <div className="text-sm border border-amber-400 bg-amber-50 text-amber-900 rounded p-2">
              ⚠ Ersetzt alle bisherigen Projekte ({existingProjects}) und Schüler ({existingStudents}) und setzt die Verteilung zurück.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
          <Button onClick={handleGenerate}>Generieren</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
