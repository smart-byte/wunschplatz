import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a list of grade numbers. If all are consecutive and there are ≥ 2,
 * show as "5-13". Otherwise comma-separated ("5, 7, 9").
 */
export function formatGrades(grades: number[]): string {
  if (grades.length === 0) return '';
  const sorted = [...grades].sort((a, b) => a - b);
  if (sorted.length === 1) return String(sorted[0]);
  const consecutive = sorted.every((g, i) => i === 0 || g === sorted[i - 1] + 1);
  if (consecutive) return `${sorted[0]}-${sorted[sorted.length - 1]}`;
  return sorted.join(', ');
}
