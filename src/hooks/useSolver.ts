import { useState, useCallback } from 'react';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { useSolverConfigStore } from '@/store/useSolverConfigStore';
import type { SolveResponse, SolveRequest } from '@/solver/solver.worker';
import type { SolverStats } from '@/types';

export function useSolver() {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastStats, setLastStats] = useState<SolverStats | null>(null);

  const run = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const students = useStudentsStore.getState().students;
      const projects = useProjectsStore.getState().projects;
      const config = useSolverConfigStore.getState().config;

      const worker = new Worker(
        new URL('@/solver/solver.worker.ts', import.meta.url),
        { type: 'module' },
      );

      const result = await new Promise<SolveResponse>((resolve, reject) => {
        worker.onmessage = (e: MessageEvent<SolveResponse>) => resolve(e.data);
        worker.onerror = (e) => reject(new Error(e.message || 'Worker error'));
        const req: SolveRequest = { type: 'solve', students, projects, config };
        worker.postMessage(req);
      });

      worker.terminate();

      if (result.type === 'error') {
        setError(result.message);
        return;
      }

      useAssignmentsStore.getState().setAssignments(
        result.payload.assignments,
        result.payload.run,
      );
      setLastStats(result.payload.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }, []);

  return { running, error, lastStats, run };
}
