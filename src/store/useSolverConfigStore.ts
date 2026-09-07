import { create } from 'zustand';
import type { SolverConfig } from '@/types';
import { defaultSolverConfig } from '@/types';
import { editableStore } from './session';

type State = {
  config: SolverConfig;
  setConfig: (config: SolverConfig) => void;
  reset: () => void;
};

export const useSolverConfigStore = create<State>()(
  editableStore((set) => ({
    config: defaultSolverConfig,
    setConfig: (config) => set({ config }),
    reset: () => set({ config: defaultSolverConfig }),
  })),
);
