import type { Student } from '@/types';

// Tailwind-friendly palette. Deterministic per group via hash.
const PALETTE = [
  { ring: 'ring-rose-400', text: 'text-rose-700', bg: 'bg-rose-100', label: 'Rose' },
  { ring: 'ring-amber-400', text: 'text-amber-700', bg: 'bg-amber-100', label: 'Amber' },
  { ring: 'ring-lime-400', text: 'text-lime-700', bg: 'bg-lime-100', label: 'Lime' },
  { ring: 'ring-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-100', label: 'Emerald' },
  { ring: 'ring-cyan-400', text: 'text-cyan-700', bg: 'bg-cyan-100', label: 'Cyan' },
  { ring: 'ring-blue-400', text: 'text-blue-700', bg: 'bg-blue-100', label: 'Blue' },
  { ring: 'ring-violet-400', text: 'text-violet-700', bg: 'bg-violet-100', label: 'Violet' },
  { ring: 'ring-fuchsia-400', text: 'text-fuchsia-700', bg: 'bg-fuchsia-100', label: 'Fuchsia' },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function getGroupColor(groupId: string) {
  return PALETTE[hashString(groupId) % PALETTE.length];
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
