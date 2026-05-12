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
};

export const useStudentsStore = create<State>()(
  persist(
    (set) => ({
      students: [],
      addStudent: (data) => set((s) => ({
        students: [...s.students, { ...data, id: uuid() }],
      })),
      addStudents: (datas) => set((s) => ({
        students: [...s.students, ...datas.map((d) => ({ ...d, id: uuid() }))],
      })),
      updateStudent: (id, data) => set((s) => ({
        students: s.students.map((st) => st.id === id ? { ...st, ...data } : st),
      })),
      removeStudent: (id) => set((s) => ({
        students: s.students.filter((st) => st.id !== id),
      })),
      removeAll: () => set({ students: [] }),
      setStudents: (students) => set({ students }),
    }),
    {
      name: 'students',
      storage: createJSONStorage(() => createIdbStorage('students')),
    },
  ),
);
