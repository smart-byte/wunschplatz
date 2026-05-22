import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { Student } from '@/types';
import { createIdbStorage } from './persist';
import { pickFreeColorIndex } from '@/lib/groups';

type State = {
  students: Student[];
  groupColors: Record<string, number>; // groupId → palette index
  addStudent: (data: Omit<Student, 'id'>) => void;
  addStudents: (data: Omit<Student, 'id'>[]) => void;
  updateStudent: (id: string, data: Partial<Omit<Student, 'id'>>) => void;
  removeStudent: (id: string) => void;
  removeAll: () => void;
  setStudents: (students: Student[]) => void;
  // Group actions
  createGroup: (studentIds: string[], templateStudentId?: string) => { ok: true; groupId: string } | { ok: false; error: string };
  addToGroup: (studentId: string, groupId: string) => { ok: true } | { ok: false; error: string };
  removeFromGroup: (studentId: string) => void;
  syncGroupPriorities: (groupId: string, priorities: string[]) => void;
  setGroupColor: (groupId: string, paletteIndex: number) => void;
};

function activeGroupIds(students: Student[]): Set<string> {
  const ids = new Set<string>();
  for (const s of students) if (s.groupId) ids.add(s.groupId);
  return ids;
}

function cleanupColors(
  colors: Record<string, number>,
  students: Student[],
): Record<string, number> {
  const active = activeGroupIds(students);
  const next: Record<string, number> = {};
  for (const [gid, idx] of Object.entries(colors)) {
    if (active.has(gid)) next[gid] = idx;
  }
  return next;
}

export const useStudentsStore = create<State>()(
  persist(
    (set, get) => ({
      students: [],
      groupColors: {},
      addStudent: (data) => set((s) => ({
        students: [...s.students, { ...data, id: uuid() }],
      })),
      addStudents: (datas) => set((s) => ({
        students: [...s.students, ...datas.map((d) => ({ ...d, id: uuid() }))],
      })),
      updateStudent: (id, data) => set((s) => {
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
        let filtered = s.students.filter((st) => st.id !== id);
        if (target?.groupId) {
          const remaining = filtered.filter((st) => st.groupId === target.groupId);
          if (remaining.length < 2) {
            filtered = filtered.map((st) =>
              st.groupId === target.groupId ? { ...st, groupId: undefined } : st,
            );
          }
        }
        return { students: filtered, groupColors: cleanupColors(s.groupColors, filtered) };
      }),
      removeAll: () => set({ students: [], groupColors: {} }),
      setStudents: (students) => set((s) => ({
        students,
        groupColors: cleanupColors(s.groupColors, students),
      })),

      createGroup: (studentIds, templateStudentId) => {
        const state = get();
        const members = state.students.filter((s) => studentIds.includes(s.id));
        if (members.length < 2) return { ok: false as const, error: 'Mindestens 2 Schüler erforderlich.' };
        if (members.some((m) => m.groupId)) {
          return { ok: false as const, error: 'Schüler ist bereits in einer Gruppe. Erst entfernen.' };
        }
        let template = members[0];
        if (templateStudentId) {
          const t = members.find((m) => m.id === templateStudentId);
          if (!t) return { ok: false as const, error: 'Vorlage-Schüler nicht in Auswahl.' };
          template = t;
        }
        const groupId = uuid();
        const sharedPriorities = template.priorities;
        const usedIndices = Object.values(state.groupColors);
        const colorIndex = pickFreeColorIndex(groupId, usedIndices);
        set((s) => ({
          students: s.students.map((st) =>
            studentIds.includes(st.id)
              ? { ...st, groupId, priorities: sharedPriorities }
              : st,
          ),
          groupColors: { ...s.groupColors, [groupId]: colorIndex },
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
        let updated = s.students.map((st) =>
          st.id === studentId ? { ...st, groupId: undefined } : st,
        );
        const remaining = updated.filter((st) => st.groupId === groupId);
        if (remaining.length < 2) {
          updated = updated.map((st) =>
            st.groupId === groupId ? { ...st, groupId: undefined } : st,
          );
        }
        return { students: updated, groupColors: cleanupColors(s.groupColors, updated) };
      }),

      syncGroupPriorities: (groupId, priorities) => set((s) => ({
        students: s.students.map((st) =>
          st.groupId === groupId ? { ...st, priorities } : st,
        ),
      })),

      setGroupColor: (groupId, paletteIndex) => set((s) => ({
        groupColors: { ...s.groupColors, [groupId]: paletteIndex },
      })),
    }),
    {
      name: 'students',
      storage: createJSONStorage(() => createIdbStorage('students')),
    },
  ),
);
