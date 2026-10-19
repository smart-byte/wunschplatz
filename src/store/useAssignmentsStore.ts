import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { Assignment, Distribution, SolverRun } from '@/types';
import { defaultSolverConfig } from '@/types';
import { editableStore } from './session';

function emptyRun(): SolverRun {
  return {
    kind: 'manual',
    timestamp: Date.now(),
    config: defaultSolverConfig,
    score: 0,
    stats: {
      totalStudents: 0,
      assignedByPriority: [0, 0, 0, 0, 0],
      notInTop5: 0,
      unassigned: 0,
    },
  };
}

function pickManualName(existing: Distribution[]): string {
  const taken = new Set(existing.map((d) => d.name));
  if (!taken.has('Manuelle Verteilung')) return 'Manuelle Verteilung';
  let n = 2;
  while (taken.has(`Manuelle Verteilung ${n}`)) n++;
  return `Manuelle Verteilung ${n}`;
}

type State = {
  distributions: Distribution[];
  activeId: string | null;

  createDistribution: (name: string, assignments: Assignment[], run: SolverRun) => string;
  duplicateDistribution: (sourceId: string, newName: string) => string | null;
  renameDistribution: (id: string, name: string) => void;
  removeDistribution: (id: string) => void;
  setActive: (id: string | null) => void;
  updateAssignment: (
    studentId: string,
    projectId: string | null,
    priorityRank: number | null,
    manualName?: string,
  ) => void;
  clear: () => void;
  hydrate: (distributions: Distribution[], activeId: string | null) => void;
};

function nextDefaultName(existing: Distribution[]): string {
  let n = existing.length + 1;
  const taken = new Set(existing.map((d) => d.name));
  while (taken.has(`Lauf ${n}`)) n++;
  return `Lauf ${n}`;
}

export const useAssignmentsStore = create<State>()(
  editableStore((set, get) => ({
    distributions: [],
    activeId: null,

    createDistribution: (name, assignments, run) => {
      const id = uuid();
      const now = Date.now();
      const dist: Distribution = {
        id,
        name: name.trim() || nextDefaultName(get().distributions),
        createdAt: now,
        updatedAt: now,
        assignments,
        run,
      };
      set((s) => ({ distributions: [...s.distributions, dist], activeId: id }));
      return id;
    },

    duplicateDistribution: (sourceId, newName) => {
      const state = get();
      const src = state.distributions.find((d) => d.id === sourceId);
      if (!src) return null;
      const id = uuid();
      const now = Date.now();
      const copy: Distribution = {
        id,
        name: newName.trim() || `${src.name} (Kopie)`,
        createdAt: now,
        updatedAt: now,
        assignments: src.assignments.map((a) => ({ ...a })),
        run: src.run,
      };
      set((s) => ({ distributions: [...s.distributions, copy], activeId: id }));
      return id;
    },

    renameDistribution: (id, name) =>
      set((s) => ({
        distributions: s.distributions.map((d) =>
          d.id === id ? { ...d, name: name.trim() || d.name, updatedAt: Date.now() } : d,
        ),
      })),

    removeDistribution: (id) =>
      set((s) => {
        const filtered = s.distributions.filter((d) => d.id !== id);
        let activeId = s.activeId;
        if (activeId === id) {
          activeId = filtered.length > 0 ? filtered[filtered.length - 1].id : null;
        }
        return { distributions: filtered, activeId };
      }),

    setActive: (id) => set({ activeId: id }),

    updateAssignment: (studentId, projectId, priorityRank, manualName) =>
      set((s) => {
        let distributions = s.distributions;
        let activeId = s.activeId;
        if (!activeId) {
          const id = uuid();
          const now = Date.now();
          const manual: Distribution = {
            id,
            name: manualName || pickManualName(distributions),
            createdAt: now,
            updatedAt: now,
            assignments: [],
            run: emptyRun(),
          };
          distributions = [...distributions, manual];
          activeId = id;
        }
        const newAssignment: Assignment = {
          studentId,
          projectId,
          priorityRank,
          manuallyEdited: true,
        };
        const next = distributions.map((d) => {
          if (d.id !== activeId) return d;
          const exists = d.assignments.some((a) => a.studentId === studentId);
          const nextAssignments = exists
            ? d.assignments.map((a) => (a.studentId === studentId ? newAssignment : a))
            : [...d.assignments, newAssignment];
          return { ...d, assignments: nextAssignments, updatedAt: Date.now() };
        });
        return { distributions: next, activeId };
      }),

    clear: () => set({ distributions: [], activeId: null }),

    hydrate: (distributions, activeId) => set({ distributions, activeId }),
  })),
);

export function useActiveDistribution(): Distribution | null {
  return useAssignmentsStore((s) => s.distributions.find((d) => d.id === s.activeId) ?? null);
}
