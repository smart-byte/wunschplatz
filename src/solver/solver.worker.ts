/// <reference lib="webworker" />
import { solveAssignments } from './solve';
import type { Project, Student, SolverConfig } from '@/types';

export type SolveRequest = {
  type: 'solve';
  students: Student[];
  projects: Project[];
  config: SolverConfig;
};

export type SolveResponse =
  | { type: 'result'; payload: ReturnType<typeof solveAssignments> }
  | { type: 'error'; message: string };

/** Sent while the solver runs, once per whole percent. */
export type SolveProgress = { type: 'progress'; percent: number };

self.onmessage = (e: MessageEvent<SolveRequest>) => {
  const msg = e.data;
  if (msg.type !== 'solve') return;
  try {
    let sent = 0;
    const result = solveAssignments(msg.students, msg.projects, msg.config, (done) => {
      const percent = Math.floor(done * 100);
      if (percent <= sent) return;
      sent = percent;
      self.postMessage({ type: 'progress', percent } satisfies SolveProgress);
    });
    const response: SolveResponse = { type: 'result', payload: result };
    self.postMessage(response);
  } catch (err) {
    const response: SolveResponse = {
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(response);
  }
};
