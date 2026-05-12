import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Assignment, SolverRun, AssignmentsState } from '@/types';
import { createIdbStorage } from './persist';

type State = AssignmentsState & {
  setAssignments: (assignments: Assignment[], run: SolverRun) => void;
  updateAssignment: (studentId: string, projectId: string | null) => void;
  clear: () => void;
};

export const useAssignmentsStore = create<State>()(
  persist(
    (set) => ({
      assignments: [],
      lastRun: null,
      setAssignments: (assignments, lastRun) => set({ assignments, lastRun }),
      updateAssignment: (studentId, projectId) => set((s) => ({
        assignments: s.assignments.map((a) =>
          a.studentId === studentId
            ? { ...a, projectId, manuallyEdited: true }
            : a,
        ),
      })),
      clear: () => set({ assignments: [], lastRun: null }),
    }),
    {
      name: 'assignments',
      storage: createJSONStorage(() => createIdbStorage('assignments')),
    },
  ),
);
