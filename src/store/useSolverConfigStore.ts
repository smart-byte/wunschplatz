import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SolverConfig } from '@/types';
import { defaultSolverConfig } from '@/types';
import { createIdbStorage } from './persist';

type State = {
  config: SolverConfig;
  setConfig: (config: SolverConfig) => void;
  reset: () => void;
};

export const useSolverConfigStore = create<State>()(
  persist(
    (set) => ({
      config: defaultSolverConfig,
      setConfig: (config) => set({ config }),
      reset: () => set({ config: defaultSolverConfig }),
    }),
    {
      name: 'solverConfig',
      storage: createJSONStorage(() => createIdbStorage('solverConfig')),
    },
  ),
);
