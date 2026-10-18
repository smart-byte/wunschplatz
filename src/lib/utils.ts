import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatGrades(grades: number[]): string {
  if (grades.length === 0) return '';
  const sorted = [...grades].sort((a, b) => a - b);
  if (sorted.length === 1) return String(sorted[0]);
  const consecutive = sorted.every((g, i) => i === 0 || g === sorted[i - 1] + 1);
  if (consecutive) return `${sorted[0]}-${sorted[sorted.length - 1]}`;
  return sorted.join(', ');
}

/** Counts up from the number of items, skipping names still in use after a delete. */
export function nextDefaultName(taken: string[], format: (n: number) => string): string {
  const used = new Set(taken);
  let n = taken.length + 1;
  while (used.has(format(n))) n++;
  return format(n);
}
