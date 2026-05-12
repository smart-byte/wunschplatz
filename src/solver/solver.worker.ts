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

self.onmessage = (e: MessageEvent<SolveRequest>) => {
  const msg = e.data;
  if (msg.type !== 'solve') return;
  try {
    const result = solveAssignments(msg.students, msg.projects, msg.config);
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
