import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { Project } from '@/types';
import { createIdbStorage } from './persist';

type State = {
  projects: Project[];
  addProject: (data: Omit<Project, 'id'>) => void;
  updateProject: (id: string, data: Partial<Omit<Project, 'id'>>) => void;
  removeProject: (id: string) => void;
  setProjects: (projects: Project[]) => void;
};

export const useProjectsStore = create<State>()(
  persist(
    (set) => ({
      projects: [],
      addProject: (data) => set((s) => ({
        projects: [...s.projects, { ...data, id: uuid() }],
      })),
      updateProject: (id, data) => set((s) => ({
        projects: s.projects.map((p) => p.id === id ? { ...p, ...data } : p),
      })),
      removeProject: (id) => set((s) => ({
        projects: s.projects.filter((p) => p.id !== id),
      })),
      setProjects: (projects) => set({ projects }),
    }),
    {
      name: 'projects',
      storage: createJSONStorage(() => createIdbStorage('projects')),
    },
  ),
);
