import { defaultSolverConfig, type RoundData } from '@/types';
import { useProjectsStore } from './useProjectsStore';
import { useStudentsStore } from './useStudentsStore';
import { useAssignmentsStore } from './useAssignmentsStore';
import { useSolverConfigStore } from './useSolverConfigStore';
import { useRoundsStore } from './useRoundsStore';
import { applyStoreUpdate, notifySession, useSessionStore } from './session';
import { sameValue } from './mergeChanges';
import type { SavedRound } from './persist';

export const workspaceStores = [
  useProjectsStore,
  useStudentsStore,
  useAssignmentsStore,
  useSolverConfigStore,
  useRoundsStore,
];

export function emptyRoundData(): RoundData {
  return {
    projects: [],
    students: [],
    groupColors: {},
    distributions: [],
    distributionActiveId: null,
    solverConfig: defaultSolverConfig,
  };
}

export function snapshotWorkingSet(): RoundData {
  return {
    projects: useProjectsStore.getState().projects,
    students: useStudentsStore.getState().students,
    groupColors: useStudentsStore.getState().groupColors,
    distributions: useAssignmentsStore.getState().distributions,
    distributionActiveId: useAssignmentsStore.getState().activeId,
    solverConfig: useSolverConfigStore.getState().config,
  };
}

export function applyWorkingSet(data: RoundData): void {
  const current = snapshotWorkingSet();
  applyStoreUpdate(() => {
    if (!sameValue(current.projects, data.projects))
      useProjectsStore.getState().setProjects(data.projects);
    if (!sameValue([current.students, current.groupColors], [data.students, data.groupColors]))
      useStudentsStore.getState().hydrate(data.students, data.groupColors);
    if (
      !sameValue(
        [current.distributions, current.distributionActiveId],
        [data.distributions, data.distributionActiveId],
      )
    )
      useAssignmentsStore.getState().hydrate(data.distributions, data.distributionActiveId);
    if (!sameValue(current.solverConfig, data.solverConfig))
      useSolverConfigStore.getState().setConfig(data.solverConfig);
  });
}

export function snapshotRounds(): SavedRound[] {
  const { rounds, activeRoundId } = useRoundsStore.getState();
  return rounds.map(({ status: _status, data, ...round }) => {
    const saved = round.id === activeRoundId ? snapshotWorkingSet() : data;
    if (!saved) throw new Error(`Round ${round.id} has no data`);
    return { ...round, data: saved };
  });
}

export function applySavedRounds(
  rounds: SavedRound[],
  selectedId = useRoundsStore.getState().activeRoundId,
): void {
  const active = rounds.find((r) => r.id === selectedId) ?? rounds[0];
  if (!active) throw new Error('No rounds remain');
  if (selectedId && active.id !== selectedId) {
    useSessionStore.setState((s) => ({ generation: s.generation + 1 }));
    notifySession('roundRemoved');
  }
  applyStoreUpdate(() => {
    const next = rounds.map((r) => ({
      ...r,
      status: r.id === active.id ? ('active' as const) : ('idle' as const),
      data: r.id === active.id ? undefined : r.data,
    }));
    if (
      !sameValue(useRoundsStore.getState().rounds, next) ||
      useRoundsStore.getState().activeRoundId !== active.id
    )
      useRoundsStore.setState({ rounds: next, activeRoundId: active.id });
    applyWorkingSet(active.data);
  });
}
