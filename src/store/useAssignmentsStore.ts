import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Assignment, SolverRun, AssignmentsState } from '@/types';
import { createIdbStorage } from './persist';

type State = AssignmentsState & {
  setAssignments: (assignments: Assignment[], run: SolverRun) => void;
  updateAssignment: (studentId: string, projectId: string | null, priorityRank: number | null) => void;
  clear: () => void;
};

export const useAssignmentsStore = create<State>()(
  persist(
    (set) => ({
      assignments: [],
      lastRun: null,
      setAssignments: (assignments, lastRun) => set({ assignments, lastRun }),
      updateAssignment: (studentId, projectId, priorityRank) => set((s) => {
        const exists = s.assignments.some((a) => a.studentId === studentId);
        if (exists) {
          return {
            assignments: s.assignments.map((a) =>
              a.studentId === studentId
                ? { ...a, projectId, priorityRank, manuallyEdited: true }
                : a,
            ),
          };
        }
        // Upsert: student had no assignment yet (e.g. added after solver run)
        return {
          assignments: [
            ...s.assignments,
            { studentId, projectId, priorityRank, manuallyEdited: true },
          ],
        };
      }),
      clear: () => set({ assignments: [], lastRun: null }),
    }),
    {
      name: 'assignments',
      storage: createJSONStorage(() => createIdbStorage('assignments')),
    },
  ),
);
