import { v4 as uuid } from 'uuid';
import { type Round, type RoundData, type FormBlueprint, type RoundPhase } from '@/types';
import { useRoundsStore } from './useRoundsStore';
import { flushWorkspace } from './workspaceSync';
import { applyStoreUpdate, assertEditable, useSessionStore } from './session';
import {
  emptyRoundData,
  snapshotWorkingSet,
  snapshotRounds,
  applySavedRounds,
} from './workspaceState';

let chain: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const execute = async () => {
    assertEditable();
    useSessionStore.setState((s) => ({ phase: 'switching', generation: s.generation + 1 }));
    try {
      await flushWorkspace();
      return await fn();
    } finally {
      if (useSessionStore.getState().phase === 'switching')
        useSessionStore.setState({ phase: 'ready' });
    }
  };
  const run = chain.then(execute, execute);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function switchRound(targetId: string): Promise<void> {
  return withLock(async () => {
    const { rounds, activeRoundId } = useRoundsStore.getState();
    if (targetId === activeRoundId) return;
    const target = rounds.find((r) => r.id === targetId);
    if (!target) throw new Error(`Round ${targetId} not found`);
    if (!target.data) throw new Error(`Round ${targetId} has no data`);
    applySavedRounds(snapshotRounds(), targetId);
    await flushWorkspace();
  });
}

export function createRound(name: string, createdAt: string): Promise<void> {
  return withLock(async () => {
    const round = {
      id: uuid(),
      name,
      createdAt,
      phase: 'planned' as const,
      data: emptyRoundData(),
    };
    applySavedRounds([...snapshotRounds(), round], round.id);
    await flushWorkspace();
  });
}

export function setActiveRoundBlueprint(blueprint: FormBlueprint): void {
  const s = useRoundsStore.getState();
  if (!s.activeRoundId) return;
  useRoundsStore.setState({
    rounds: s.rounds.map((r) =>
      r.id === s.activeRoundId
        ? {
            ...r,
            blueprint,
            blueprintHistory: r.blueprint
              ? [...(r.blueprintHistory ?? []), r.blueprint]
              : r.blueprintHistory,
          }
        : r,
    ),
  });
}

export function setRoundPhase(id: string, phase: RoundPhase): void {
  useRoundsStore.setState((s) => ({
    rounds: s.rounds.map((r) => (r.id === id ? { ...r, phase } : r)),
  }));
}

export async function renameRound(id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Round name must not be empty');
  useRoundsStore.setState((s) => {
    if (!s.rounds.some((round) => round.id === id)) throw new Error(`Round ${id} not found`);
    return {
      rounds: s.rounds.map((round) => (round.id === id ? { ...round, name: trimmed } : round)),
    };
  });
  await flushWorkspace();
}

export function duplicateRound(id: string, createdAt: string, copyName?: string): Promise<void> {
  return withLock(async () => {
    const s = useRoundsStore.getState();
    const source = s.rounds.find((r) => r.id === id);
    if (!source) throw new Error(`Round ${id} not found`);
    let data: RoundData;
    if (source.id === s.activeRoundId) data = snapshotWorkingSet();
    else if (source.data) data = structuredClone(source.data);
    else throw new Error(`Round ${id} has no data`);
    const copy: Round = {
      id: uuid(),
      name: copyName?.trim() || `${source.name} (Kopie)`,
      createdAt,
      status: 'idle',
      phase: 'planned',
      blueprint: source.blueprint ? structuredClone(source.blueprint) : undefined,
      blueprintHistory: source.blueprintHistory
        ? structuredClone(source.blueprintHistory)
        : undefined,
      data,
    };
    applyStoreUpdate(() => useRoundsStore.setState((st) => ({ rounds: [...st.rounds, copy] })));
    await flushWorkspace();
  });
}

export function deleteRound(id: string): Promise<void> {
  return withLock(async () => {
    const s = useRoundsStore.getState();
    if (id === s.activeRoundId) throw new Error('Cannot delete the active round');
    if (!s.rounds.some((r) => r.id === id)) throw new Error(`Round ${id} not found`);
    applyStoreUpdate(() =>
      useRoundsStore.setState((st) => ({ rounds: st.rounds.filter((r) => r.id !== id) })),
    );
    await flushWorkspace();
  });
}
