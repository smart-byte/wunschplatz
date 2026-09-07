import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { Project } from '@/types';
import { editableStore } from './session';

type State = {
  projects: Project[];
  addProject: (data: Omit<Project, 'id'>) => void;
  updateProject: (id: string, data: Partial<Omit<Project, 'id'>>) => void;
  removeProject: (id: string) => void;
  setProjects: (projects: Project[]) => void;
};

export const useProjectsStore = create<State>()(
  editableStore((set) => ({
    projects: [],
    addProject: (data) =>
      set((s) => ({
        projects: [...s.projects, { ...data, id: uuid() }],
      })),
    updateProject: (id, data) =>
      set((s) => ({
        projects: s.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
      })),
    removeProject: (id) =>
      set((s) => ({
        projects: s.projects.filter((p) => p.id !== id),
      })),
    setProjects: (projects) => set({ projects }),
  })),
);
