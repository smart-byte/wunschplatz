import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SolverConfigForm } from '@/components/optimize/SolverConfigForm';
import { useSolver } from '@/hooks/useSolver';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useProjectsStore } from '@/store/useProjectsStore';
import { toast } from 'sonner';

export default function OptimizePage() {
  const navigate = useNavigate();
  const { running, error, lastStats, run } = useSolver();
  const studentCount = useStudentsStore((s) => s.students.length);
  const projectCount = useProjectsStore((s) => s.projects.length);

  async function handleRun() {
    await run();
    toast.success('Verteilung berechnet');
    navigate('/distribution');
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Optimierung</h1>
      <p className="text-sm text-muted-foreground">
        {studentCount} Schüler · {projectCount} Projekte
      </p>
      <SolverConfigForm />
      <div className="flex items-center gap-4">
        <Button
          size="lg"
          disabled={running || studentCount === 0 || projectCount === 0}
          onClick={handleRun}
        >
          {running ? 'Berechne…' : 'Verteilung berechnen'}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      {lastStats && (
        <div className="text-sm text-muted-foreground">
          Letzte Berechnung: Prio1: {lastStats.assignedByPriority[0]} · Prio2: {lastStats.assignedByPriority[1]} · …
        </div>
      )}
    </div>
  );
}
