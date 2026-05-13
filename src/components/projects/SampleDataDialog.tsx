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

const MIN_PROJECTS = 1;
const MIN_STUDENTS = 1;
const MAX_STUDENTS = 5000;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function SampleDataDialog() {
  const [open, setOpen] = useState(false);
  const [projectCount, setProjectCount] = useState('10');
  const [studentCount, setStudentCount] = useState('200');
  const setProjects = useProjectsStore((s) => s.setProjects);
  const setStudents = useStudentsStore((s) => s.setStudents);
  const clearAssignments = useAssignmentsStore((s) => s.clear);

  const existingProjects = useProjectsStore((s) => s.projects.length);
  const existingStudents = useStudentsStore((s) => s.students.length);
  const willReplace = existingProjects > 0 || existingStudents > 0;

  function parseClamped(raw: string, min: number, max: number, fallback: number): number {
    const n = parseInt(raw, 10);
    if (isNaN(n)) return fallback;
    return clamp(n, min, max);
  }

  function handleGenerate() {
    const pCount = parseClamped(projectCount, MIN_PROJECTS, MAX_SAMPLE_PROJECTS, 10);
    const sCount = parseClamped(studentCount, MIN_STUDENTS, MAX_STUDENTS, 200);
    const projects = generateSampleProjects(pCount);
    const students = generateSampleStudents(sCount, projects);
    setProjects(projects);
    setStudents(students);
    clearAssignments();
    toast.success(`${projects.length} Projekte und ${students.length} Schüler generiert`);
    setOpen(false);
  }

  function commitProjectCount() {
    const n = parseClamped(projectCount, MIN_PROJECTS, MAX_SAMPLE_PROJECTS, 10);
    setProjectCount(String(n));
  }

  function commitStudentCount() {
    const n = parseClamped(studentCount, MIN_STUDENTS, MAX_STUDENTS, 200);
    setStudentCount(String(n));
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
                min={MIN_PROJECTS}
                max={MAX_SAMPLE_PROJECTS}
                value={projectCount}
                onChange={(e) => setProjectCount(e.target.value)}
                onBlur={commitProjectCount}
              />
              <p className="text-xs text-muted-foreground">Max. {MAX_SAMPLE_PROJECTS}</p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="studentCount">Anzahl Schüler</Label>
              <Input
                id="studentCount"
                type="number"
                min={MIN_STUDENTS}
                max={MAX_STUDENTS}
                value={studentCount}
                onChange={(e) => setStudentCount(e.target.value)}
                onBlur={commitStudentCount}
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
