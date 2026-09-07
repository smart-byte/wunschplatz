import { createStore, get } from 'idb-keyval';
import { v4 as uuid } from 'uuid';
import type {
  Assignment,
  Distribution,
  Project,
  Round,
  RoundData,
  SolverRun,
  Student,
} from '@/types';
import { PALETTE_KEYS } from '@/lib/groups';
import { emptyRoundData } from './workspaceState';
import { STORAGE_KEYS } from './storageKeys';
import type { Workspace } from './persist';

type Legacy<T> = { state: T; version?: number };

async function read<T>(key: string): Promise<Legacy<T> | undefined> {
  const value = await get<string>(key, createStore(`wunschplatz-${key}`, key));
  if (value == null) return undefined;
  const parsed = JSON.parse(value) as Legacy<T>;
  if (!parsed?.state || typeof parsed.state !== 'object') throw new Error('Invalid saved data');
  return parsed;
}

export async function readLegacyWorkspace(
  createdAt: string,
  defaultName: string,
): Promise<{ workspace: Workspace; activeRoundId: string }> {
  const [projects, students, assignments, config, rounds] = await Promise.all([
    read<{ projects: Project[] }>(STORAGE_KEYS.projects),
    read<{ students: Student[]; groupColors?: Record<string, string | number> }>(
      STORAGE_KEYS.students,
    ),
    read<{
      distributions?: Distribution[];
      activeId?: string | null;
      assignments?: Assignment[];
      lastRun?: SolverRun;
    }>(STORAGE_KEYS.assignments),
    read<{ config: RoundData['solverConfig'] }>(STORAGE_KEYS.solverConfig),
    read<{ rounds: Round[]; activeRoundId: string | null }>(STORAGE_KEYS.rounds),
  ]);
  const working = emptyRoundData();
  working.projects = projects?.state.projects ?? [];
  working.students = students?.state.students ?? [];
  for (const [id, color] of Object.entries(students?.state.groupColors ?? {})) {
    if (typeof color === 'string') working.groupColors[id] = color;
    else if ((students?.version ?? 0) < 2 && Number.isInteger(color))
      working.groupColors[id] =
        PALETTE_KEYS[((color % PALETTE_KEYS.length) + PALETTE_KEYS.length) % PALETTE_KEYS.length];
  }
  const previous = assignments?.state;
  if ((assignments?.version ?? 0) < 2 && previous?.assignments?.length && previous.lastRun) {
    const id = uuid();
    working.distributions = [
      {
        id,
        name: 'Verteilung 1',
        createdAt: previous.lastRun.timestamp,
        updatedAt: previous.lastRun.timestamp,
        assignments: previous.assignments,
        run: previous.lastRun,
      },
    ];
    working.distributionActiveId = id;
  } else {
    working.distributions = previous?.distributions ?? [];
    working.distributionActiveId = previous?.activeId ?? null;
  }
  working.solverConfig = config?.state.config ?? working.solverConfig;
  if (!rounds?.state.rounds.length) {
    const id = uuid();
    return {
      workspace: {
        version: 1,
        revision: 0,
        rounds: [{ id, name: defaultName, createdAt, phase: 'running', data: working }],
      },
      activeRoundId: id,
    };
  }
  const activeRoundId = rounds.state.activeRoundId;
  if (!rounds.state.rounds.some((r) => r.id === activeRoundId && r.status === 'active'))
    throw new Error('The saved active round is missing');
  return {
    activeRoundId: activeRoundId!,
    workspace: {
      version: 1,
      revision: 0,
      rounds: rounds.state.rounds.map(({ status: _status, data, ...round }) => {
        // A staged target snapshot takes precedence over an interrupted legacy working set.
        const saved = data ?? (round.id === activeRoundId ? working : undefined);
        if (!saved) throw new Error(`Round ${round.id} has no data`);
        return { ...round, data: saved };
      }),
    },
  };
}
