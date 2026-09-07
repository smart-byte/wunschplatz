import { create } from 'zustand';
import type { Round } from '@/types';
import { editableStore } from './session';

export type RoundsState = {
  rounds: Round[];
  activeRoundId: string | null;
};

export const useRoundsStore = create<RoundsState>()(
  editableStore((): RoundsState => ({ rounds: [], activeRoundId: null })),
);
