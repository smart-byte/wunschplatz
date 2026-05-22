import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { Assignment, Distribution, SolverRun } from '@/types';
import { createIdbStorage } from './persist';

type State = {
  distributions: Distribution[];
  activeId: string | null;

  // Create from solver result; returns new id and sets as active.
  createDistribution: (name: string, assignments: Assignment[], run: SolverRun) => string;
  duplicateDistribution: (sourceId: string, newName: string) => string | null;
  renameDistribution: (id: string, name: string) => void;
  removeDistribution: (id: string) => void;
  setActive: (id: string | null) => void;
  // Update an assignment on the ACTIVE distribution. Upserts if missing.
  updateAssignment: (studentId: string, projectId: string | null, priorityRank: number | null) => void;
  // Remove ALL distributions (used by full-reset operations).
  clear: () => void;
};

function nextDefaultName(existing: Distribution[]): string {
  let n = existing.length + 1;
  const taken = new Set(existing.map((d) => d.name));
  while (taken.has(`Lauf ${n}`)) n++;
  return `Lauf ${n}`;
}

export const useAssignmentsStore = create<State>()(
  persist(
    (set, get) => ({
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

      renameDistribution: (id, name) => set((s) => ({
        distributions: s.distributions.map((d) =>
          d.id === id ? { ...d, name: name.trim() || d.name, updatedAt: Date.now() } : d,
        ),
      })),

      removeDistribution: (id) => set((s) => {
        const filtered = s.distributions.filter((d) => d.id !== id);
        let activeId = s.activeId;
        if (activeId === id) {
          activeId = filtered.length > 0 ? filtered[filtered.length - 1].id : null;
        }
        return { distributions: filtered, activeId };
      }),

      setActive: (id) => set({ activeId: id }),

      updateAssignment: (studentId, projectId, priorityRank) => set((s) => {
        if (!s.activeId) return { distributions: s.distributions };
        return {
          distributions: s.distributions.map((d) => {
            if (d.id !== s.activeId) return d;
            const exists = d.assignments.some((a) => a.studentId === studentId);
            const nextAssignments = exists
              ? d.assignments.map((a) =>
                  a.studentId === studentId
                    ? { ...a, projectId, priorityRank, manuallyEdited: true }
                    : a,
                )
              : [
                  ...d.assignments,
                  { studentId, projectId, priorityRank, manuallyEdited: true },
                ];
            return { ...d, assignments: nextAssignments, updatedAt: Date.now() };
          }),
        };
      }),

      clear: () => set({ distributions: [], activeId: null }),
    }),
    {
      name: 'assignments',
      version: 2,
      storage: createJSONStorage(() => createIdbStorage('assignments')),
      // v1 stored `{ assignments, lastRun }` as a single distribution.
      // v2 stores `{ distributions, activeId }`.
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Partial<State> & { assignments?: Assignment[]; lastRun?: SolverRun | null };
        if (version < 2) {
          const out: Partial<State> = { distributions: [], activeId: null };
          if (p.assignments && p.lastRun && p.assignments.length > 0) {
            const id = uuid();
            const now = Date.now();
            const dist: Distribution = {
              id,
              name: 'Verteilung 1',
              createdAt: now,
              updatedAt: now,
              assignments: p.assignments,
              run: p.lastRun,
            };
            out.distributions = [dist];
            out.activeId = id;
          }
          return out as unknown as State;
        }
        return p as unknown as State;
      },
    },
  ),
);

// Selector helpers
export function useActiveDistribution(): Distribution | null {
  return useAssignmentsStore((s) => s.distributions.find((d) => d.id === s.activeId) ?? null);
}
