import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useSolver } from '@/hooks/useSolver';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { useRoundsStore } from '@/store/useRoundsStore';
import { useSessionStore } from '@/store/session';
import { useSolverConfigStore } from '@/store/useSolverConfigStore';
import { renameRound } from '@/store/roundsTransaction';
import { defaultSolverConfig } from '@/types';
import { solverInputSignature } from '@/lib/distribution';
import { solveAssignments } from '@/solver/solve';
import type { SolveRequest, SolveResponse } from '@/solver/solver.worker';
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
class ControlledWorker {
  static latest: ControlledWorker;
  onmessage: ((event: MessageEvent<SolveResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  request!: SolveRequest;
  terminate = vi.fn();
  constructor() {
    ControlledWorker.latest = this;
  }
  postMessage(request: SolveRequest) {
    this.request = request;
  }
  finish() {
    const { students, projects, config } = this.request;
    this.onmessage?.({
      data: { type: 'result', payload: solveAssignments(students, projects, config) },
    } as MessageEvent<SolveResponse>);
  }
}
beforeEach(() => {
  vi.stubGlobal('Worker', ControlledWorker);
  useRoundsStore.setState({
    rounds: [{ id: 'A', name: 'A', status: 'active', createdAt: 'x' }],
    activeRoundId: 'A',
  });
  useProjectsStore
    .getState()
    .setProjects([{ id: 'p', name: 'Chess', grades: [7], maxCapacity: 10, targetCapacity: 8 }]);
  useStudentsStore
    .getState()
    .setStudents([
      { id: 's', firstName: 'A', lastName: 'B', className: '7a', grade: 7, priorities: ['p'] },
    ]);
  useAssignmentsStore.getState().clear();
  useSolverConfigStore.getState().setConfig(defaultSolverConfig);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe('solver lifecycle', () => {
  it('saves a result with its exact input signature', async () => {
    const { result } = renderHook(useSolver);
    let done!: Promise<boolean>;
    act(() => {
      done = result.current.run();
    });
    await act(async () => {
      ControlledWorker.latest.finish();
      expect(await done).toBe(true);
    });
    const { students, projects, config } = ControlledWorker.latest.request;
    expect(useAssignmentsStore.getState().distributions[0].run.inputSignature).toBe(
      solverInputSignature(students, projects, config),
    );
    expect(ControlledWorker.latest.terminate).toHaveBeenCalled();
  });
  it.each(['round', 'students', 'projects', 'config', 'unmount'])(
    'cancels on %s and ignores a late worker result',
    async (change) => {
      const { result, unmount } = renderHook(useSolver);
      let done!: Promise<boolean>;
      act(() => {
        done = result.current.run();
      });
      const worker = ControlledWorker.latest;
      await act(async () => {
        if (change === 'round') useSessionStore.setState({ phase: 'switching', generation: 1 });
        else if (change === 'students')
          useStudentsStore.getState().updateStudent('s', { grade: 8 });
        else if (change === 'projects')
          useProjectsStore.getState().updateProject('p', { maxCapacity: 20 });
        else if (change === 'config')
          useSolverConfigStore
            .getState()
            .setConfig({ ...defaultSolverConfig, groupCohesionBonus: 0 });
        else unmount();
        worker.finish();
        expect(await done).toBe(false);
      });
      expect(worker.terminate).toHaveBeenCalled();
      expect(useAssignmentsStore.getState().distributions).toEqual([]);
    },
  );

  it('allows display-only renames while a calculation is running', async () => {
    const { result } = renderHook(useSolver);
    let done!: Promise<boolean>;
    act(() => {
      done = result.current.run();
    });
    await act(async () => {
      await renameRound('A', 'Renamed round');
      useProjectsStore.getState().updateProject('p', { name: 'Chess club' });
      useStudentsStore.getState().updateStudent('s', { firstName: 'Anna' });
    });
    expect(ControlledWorker.latest.terminate).not.toHaveBeenCalled();
    expect(result.current.running).toBe(true);
    await act(async () => {
      ControlledWorker.latest.finish();
      expect(await done).toBe(true);
    });
    expect(useAssignmentsStore.getState().distributions).toHaveLength(1);
  });

  it('reports a worker failure and allows a new calculation', async () => {
    const { result } = renderHook(useSolver);
    let done!: Promise<boolean>;
    act(() => {
      done = result.current.run();
    });
    const failed = ControlledWorker.latest;
    await act(async () => {
      failed.onerror?.(new ErrorEvent('error', { message: 'Worker failed' }));
      expect(await done).toBe(false);
    });
    expect(result.current.running).toBe(false);
    expect(result.current.error).toBe('optimize.solveFailed');
    expect(failed.terminate).toHaveBeenCalled();
    expect(useAssignmentsStore.getState().distributions).toEqual([]);
    act(() => {
      done = result.current.run();
    });
    await act(async () => {
      ControlledWorker.latest.finish();
      expect(await done).toBe(true);
    });
    expect(result.current.error).toBeNull();
    expect(useAssignmentsStore.getState().distributions).toHaveLength(1);
  });
});
