export type BoardSortKey = 'popularity' | 'name' | 'load' | 'utilization' | 'grade';

export const BOARD_SORT_LABELS: Record<BoardSortKey, string> = {
  popularity: 'Beliebtheit (Score)',
  name: 'Name (A-Z)',
  load: 'Belegung (absteigend)',
  utilization: 'Auslastung % (absteigend)',
  grade: 'Jahrgang (aufsteigend)',
};

export const BOARD_SORT_STORAGE_KEY = 'distribution.boardSort';

export function readStoredSortKey(): BoardSortKey {
  if (typeof window === 'undefined') return 'popularity';
  const v = window.localStorage.getItem(BOARD_SORT_STORAGE_KEY);
  return (v === 'popularity' || v === 'name' || v === 'load' || v === 'utilization' || v === 'grade')
    ? v
    : 'popularity';
}
