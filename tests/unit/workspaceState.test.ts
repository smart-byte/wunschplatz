import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { useSolverConfigStore } from '@/store/useSolverConfigStore';
import { snapshotWorkingSet, applyWorkingSet, emptyRoundData } from '@/store/workspaceState';
import { defaultSolverConfig, type Project } from '@/types';

const proj = (id: string): Project => ({
  id,
  name: id,
  grades: [7],
  maxCapacity: 10,
  targetCapacity: 8,
});

beforeEach(() => {
  useProjectsStore.setState({ projects: [] });
  useStudentsStore.setState({ students: [], groupColors: {} });
  useAssignmentsStore.setState({ distributions: [], activeId: null });
  useSolverConfigStore.setState({ config: defaultSolverConfig });
});

describe('snapshot/apply working set', () => {
  it('emptyRoundData is fully empty with default config', () => {
    expect(emptyRoundData()).toEqual({
      projects: [],
      students: [],
      groupColors: {},
      distributions: [],
      distributionActiveId: null,
      solverConfig: defaultSolverConfig,
    });
  });

  it('snapshot then apply round-trips through the live stores', () => {
    useProjectsStore.setState({ projects: [proj('p1')] });
    useStudentsStore.setState({
      students: [
        {
          id: 's1',
          firstName: 'A',
          lastName: 'B',
          className: '7a',
          grade: 7,
          priorities: ['p1'],
          groupId: 'g1',
        },
      ],
      groupColors: { g1: 'rose' },
    });
    useAssignmentsStore.getState().updateAssignment('s1', 'p1', 1);
    useSolverConfigStore.getState().setConfig({ ...defaultSolverConfig, overTargetPenalty: 17 });
    const snap = snapshotWorkingSet();

    applyWorkingSet(emptyRoundData());
    applyWorkingSet(snap);

    expect(snapshotWorkingSet()).toEqual(snap);
  });
});
