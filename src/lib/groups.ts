import type { Student } from '@/types';

// Tailwind-friendly palette. Indexed; Tailwind safelist in tailwind.config.js
// must keep all utility classes used here visible to the JIT.
export const PALETTE = [
  { ring: 'ring-rose-400', text: 'text-rose-700', bg: 'bg-rose-100', swatch: 'bg-rose-400', label: 'Rose' },
  { ring: 'ring-amber-400', text: 'text-amber-700', bg: 'bg-amber-100', swatch: 'bg-amber-400', label: 'Amber' },
  { ring: 'ring-lime-400', text: 'text-lime-700', bg: 'bg-lime-100', swatch: 'bg-lime-400', label: 'Lime' },
  { ring: 'ring-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-100', swatch: 'bg-emerald-400', label: 'Emerald' },
  { ring: 'ring-cyan-400', text: 'text-cyan-700', bg: 'bg-cyan-100', swatch: 'bg-cyan-400', label: 'Cyan' },
  { ring: 'ring-blue-400', text: 'text-blue-700', bg: 'bg-blue-100', swatch: 'bg-blue-400', label: 'Blue' },
  { ring: 'ring-violet-400', text: 'text-violet-700', bg: 'bg-violet-100', swatch: 'bg-violet-400', label: 'Violet' },
  { ring: 'ring-fuchsia-400', text: 'text-fuchsia-700', bg: 'bg-fuchsia-100', swatch: 'bg-fuchsia-400', label: 'Fuchsia' },
];

export const PALETTE_SIZE = PALETTE.length;

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function colorForIndex(idx: number) {
  const safe = ((idx % PALETTE_SIZE) + PALETTE_SIZE) % PALETTE_SIZE;
  return PALETTE[safe];
}

/**
 * Resolve a group's color. If a paletteIndex is recorded in `colorMap`, use
 * that. Otherwise fall back to hashing the groupId (legacy / unassigned).
 */
export function getGroupColor(groupId: string, colorMap?: Record<string, number>) {
  if (colorMap && colorMap[groupId] !== undefined) {
    return colorForIndex(colorMap[groupId]);
  }
  return colorForIndex(hashString(groupId));
}

/**
 * Pick the next palette index not yet used by other groups. Falls back to
 * `hashString(newGroupId)` once all PALETTE_SIZE slots are taken.
 */
export function pickFreeColorIndex(
  newGroupId: string,
  usedIndices: Iterable<number>,
): number {
  const used = new Set(usedIndices);
  for (let i = 0; i < PALETTE_SIZE; i++) {
    if (!used.has(i)) return i;
  }
  return hashString(newGroupId) % PALETTE_SIZE;
}

export function getGroupMembers(students: Student[], groupId: string): Student[] {
  return students.filter((s) => s.groupId === groupId);
}

export function getGroupsMap(students: Student[]): Map<string, Student[]> {
  const map = new Map<string, Student[]>();
  for (const s of students) {
    if (!s.groupId) continue;
    if (!map.has(s.groupId)) map.set(s.groupId, []);
    map.get(s.groupId)!.push(s);
  }
  return map;
}
