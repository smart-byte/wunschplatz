export type BoardSortKey = 'popularity' | 'name' | 'load' | 'utilization' | 'grade';

export const BOARD_SORT_LABEL_KEYS: Record<BoardSortKey, string> = {
  popularity: 'distribution.sort.popularity',
  name: 'distribution.sort.name',
  load: 'distribution.sort.load',
  utilization: 'distribution.sort.utilization',
  grade: 'distribution.sort.grade',
};

export const BOARD_SORT_STORAGE_KEY = 'distribution.boardSort.v2';

export function readStoredSortKey(): BoardSortKey {
  if (typeof window === 'undefined') return 'popularity';
  const v = window.localStorage.getItem(BOARD_SORT_STORAGE_KEY);
  return v === 'popularity' || v === 'name' || v === 'load' || v === 'utilization' || v === 'grade'
    ? v
    : 'popularity';
}
