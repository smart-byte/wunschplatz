import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { Student } from '@/types';
import { createIdbStorage } from './persist';

type State = {
  students: Student[];
  addStudent: (data: Omit<Student, 'id'>) => void;
  addStudents: (data: Omit<Student, 'id'>[]) => void;
  updateStudent: (id: string, data: Partial<Omit<Student, 'id'>>) => void;
  removeStudent: (id: string) => void;
  removeAll: () => void;
  setStudents: (students: Student[]) => void;
  // Group actions
  createGroup: (studentIds: string[]) => { ok: true; groupId: string } | { ok: false; error: string };
  addToGroup: (studentId: string, groupId: string) => { ok: true } | { ok: false; error: string };
  removeFromGroup: (studentId: string) => void;
  syncGroupPriorities: (groupId: string, priorities: string[]) => void;
};

export const useStudentsStore = create<State>()(
  persist(
    (set, get) => ({
      students: [],
      addStudent: (data) => set((s) => ({
        students: [...s.students, { ...data, id: uuid() }],
      })),
      addStudents: (datas) => set((s) => ({
        students: [...s.students, ...datas.map((d) => ({ ...d, id: uuid() }))],
      })),
      updateStudent: (id, data) => set((s) => {
        // If priorities change and student is in a group, sync siblings.
        const target = s.students.find((st) => st.id === id);
        if (!target) return { students: s.students };
        const next = s.students.map((st) => st.id === id ? { ...st, ...data } : st);
        if (data.priorities && target.groupId) {
          return {
            students: next.map((st) =>
              st.groupId === target.groupId && st.id !== id
                ? { ...st, priorities: data.priorities! }
                : st,
            ),
          };
        }
        return { students: next };
      }),
      removeStudent: (id) => set((s) => {
        const target = s.students.find((st) => st.id === id);
        const filtered = s.students.filter((st) => st.id !== id);
        // If removed student was in a group and only 1 sibling remains, dissolve group.
        if (target?.groupId) {
          const remaining = filtered.filter((st) => st.groupId === target.groupId);
          if (remaining.length < 2) {
            return {
              students: filtered.map((st) =>
                st.groupId === target.groupId ? { ...st, groupId: undefined } : st,
              ),
            };
          }
        }
        return { students: filtered };
      }),
      removeAll: () => set({ students: [] }),
      setStudents: (students) => set({ students }),

      createGroup: (studentIds) => {
        const state = get();
        const members = state.students.filter((s) => studentIds.includes(s.id));
        if (members.length < 2) return { ok: false as const, error: 'Mindestens 2 Schüler erforderlich.' };
        const grade = members[0].grade;
        if (members.some((m) => m.grade !== grade)) {
          return { ok: false as const, error: 'Alle Mitglieder müssen gleichen Jahrgang haben.' };
        }
        if (members.some((m) => m.groupId)) {
          return { ok: false as const, error: 'Schüler ist bereits in einer Gruppe. Erst entfernen.' };
        }
        const groupId = uuid();
        // Sync priorities to first member's priorities.
        const sharedPriorities = members[0].priorities;
        set((s) => ({
          students: s.students.map((st) =>
            studentIds.includes(st.id)
              ? { ...st, groupId, priorities: sharedPriorities }
              : st,
          ),
        }));
        return { ok: true as const, groupId };
      },

      addToGroup: (studentId, groupId) => {
        const state = get();
        const target = state.students.find((s) => s.id === studentId);
        if (!target) return { ok: false as const, error: 'Schüler nicht gefunden.' };
        if (target.groupId) return { ok: false as const, error: 'Schüler ist bereits in einer Gruppe.' };
        const existingMembers = state.students.filter((s) => s.groupId === groupId);
        if (existingMembers.length === 0) return { ok: false as const, error: 'Gruppe existiert nicht.' };
        if (existingMembers[0].grade !== target.grade) {
          return { ok: false as const, error: 'Jahrgang stimmt nicht überein.' };
        }
        const sharedPriorities = existingMembers[0].priorities;
        set((s) => ({
          students: s.students.map((st) =>
            st.id === studentId ? { ...st, groupId, priorities: sharedPriorities } : st,
          ),
        }));
        return { ok: true as const };
      },

      removeFromGroup: (studentId) => set((s) => {
        const target = s.students.find((st) => st.id === studentId);
        if (!target?.groupId) return { students: s.students };
        const groupId = target.groupId;
        const updated = s.students.map((st) =>
          st.id === studentId ? { ...st, groupId: undefined } : st,
        );
        // If only one sibling remains, dissolve.
        const remaining = updated.filter((st) => st.groupId === groupId);
        if (remaining.length < 2) {
          return {
            students: updated.map((st) =>
              st.groupId === groupId ? { ...st, groupId: undefined } : st,
            ),
          };
        }
        return { students: updated };
      }),

      syncGroupPriorities: (groupId, priorities) => set((s) => ({
        students: s.students.map((st) =>
          st.groupId === groupId ? { ...st, priorities } : st,
        ),
      })),
    }),
    {
      name: 'students',
      storage: createJSONStorage(() => createIdbStorage('students')),
    },
  ),
);
