import { useState, useCallback, useEffect, useRef } from 'react';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { useSolverConfigStore } from '@/store/useSolverConfigStore';
import { useRoundsStore } from '@/store/useRoundsStore';
import { assertEditable, useSessionStore } from '@/store/session';
import { solverInputSignature } from '@/lib/distribution';
import { nextDefaultName } from '@/lib/utils';
import type { SolveProgress, SolveResponse, SolveRequest } from '@/solver/solver.worker';
import { useTranslation } from 'react-i18next';

export function useSolver() {
  const { t } = useTranslation('app');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const cancel = useRef<(() => void) | null>(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancel.current?.();
    };
  }, []);

  const run = useCallback(async (): Promise<boolean> => {
    if (cancel.current) return false;
    setRunning(true);
    setProgress(0);
    setError(null);
    let worker: Worker | undefined;
    const unsubscribe: (() => void)[] = [];
    try {
      assertEditable();
      const students = useStudentsStore.getState().students;
      const projects = useProjectsStore.getState().projects;
      const config = useSolverConfigStore.getState().config;
      const roundId = useRoundsStore.getState().activeRoundId;
      const generation = useSessionStore.getState().generation;
      const signature = solverInputSignature(students, projects, config);
      const isCurrent = () =>
        mounted.current &&
        useSessionStore.getState().phase === 'ready' &&
        useSessionStore.getState().generation === generation &&
        useRoundsStore.getState().activeRoundId === roundId &&
        signature ===
          solverInputSignature(
            useStudentsStore.getState().students,
            useProjectsStore.getState().projects,
            useSolverConfigStore.getState().config,
          );
      const activeWorker = new Worker(new URL('@/solver/solver.worker.ts', import.meta.url), {
        type: 'module',
      });
      worker = activeWorker;
      const result = await new Promise<SolveResponse>((resolve, reject) => {
        cancel.current = () => {
          activeWorker.terminate();
          reject(new DOMException('Solver inputs changed', 'AbortError'));
        };
        const check = () => {
          if (!isCurrent()) cancel.current?.();
        };
        unsubscribe.push(
          useStudentsStore.subscribe(check),
          useProjectsStore.subscribe(check),
          useSolverConfigStore.subscribe(check),
          useRoundsStore.subscribe(check),
          useSessionStore.subscribe(check),
        );
        activeWorker.onmessage = (e: MessageEvent<SolveResponse | SolveProgress>) => {
          if (e.data.type !== 'progress') resolve(e.data);
          else if (mounted.current) setProgress(e.data.percent);
        };
        activeWorker.onerror = (e) => reject(new Error(e.message));
        const req: SolveRequest = { type: 'solve', students, projects, config };
        activeWorker.postMessage(req);
      });
      if (!isCurrent()) return false;
      if (result.type === 'error') throw new Error(result.message);
      const name = nextDefaultName(
        useAssignmentsStore.getState().distributions.map((d) => d.name),
        (n) => t('distribution.selector.defaultName', { n }),
      );
      useAssignmentsStore.getState().createDistribution(name, result.payload.assignments, {
        ...result.payload.run,
        kind: 'solver',
        inputSignature: signature,
      });
      return true;
    } catch (failure) {
      if (mounted.current)
        setError(
          t(
            failure instanceof DOMException && failure.name === 'AbortError'
              ? 'optimize.solveCancelled'
              : 'optimize.solveFailed',
          ),
        );
      return false;
    } finally {
      unsubscribe.forEach((fn) => fn());
      worker?.terminate();
      cancel.current = null;
      if (mounted.current) setRunning(false);
    }
  }, [t]);

  return { running, progress, error, run };
}
