import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

type Props = {
  /** Controlled mode renders no trigger; the caller opens the dialog (e.g. from a menu). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function SampleDataDialog({ open: controlledOpen, onOpenChange }: Props) {
  const { t, i18n } = useTranslation('app');
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = controlledOpen !== undefined;
  const open = controlled ? controlledOpen : internalOpen;
  const setOpen = (next: boolean) => (controlled ? onOpenChange?.(next) : setInternalOpen(next));
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
    const projects = generateSampleProjects(pCount, i18n.resolvedLanguage ?? i18n.language);
    const students = generateSampleStudents(sCount, projects);
    setProjects(projects);
    setStudents(students);
    clearAssignments();
    toast.success(
      t('projects.sample.generated', {
        projectCount: projects.length,
        studentCount: students.length,
      }),
    );
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
      {!controlled && (
        <DialogTrigger asChild>
          <Button variant="outline">
            <Sparkles className="size-4 mr-2" />
            {t('projects.sample.trigger')}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('projects.sample.title')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <p className="text-sm text-muted-foreground">{t('projects.sample.description')}</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="projectCount">{t('projects.sample.projectCountLabel')}</Label>
              <Input
                id="projectCount"
                type="number"
                min={MIN_PROJECTS}
                max={MAX_SAMPLE_PROJECTS}
                value={projectCount}
                onChange={(e) => setProjectCount(e.target.value)}
                onBlur={commitProjectCount}
              />
              <p className="text-xs text-muted-foreground">
                {t('projects.sample.maxHint', { max: MAX_SAMPLE_PROJECTS })}
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="studentCount">{t('projects.sample.studentCountLabel')}</Label>
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
              {t('projects.sample.replaceWarning', {
                projectCount: existingProjects,
                studentCount: existingStudents,
              })}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleGenerate}>{t('projects.sample.generate')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
