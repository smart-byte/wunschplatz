import type { Student } from '@/types';

// Built-in palette. Tailwind safelist uses a pattern matching these color names
// so all `bg-X-50/100/400`, `text-X-700`, `border-l-X-400`,
// and `hover:bg-X-100` variants ship.
export const PALETTE = [
  { key: 'rose',     bg: 'bg-rose-100',     rowBg: 'bg-rose-50',     rowBgHover: 'hover:!bg-rose-100',     text: 'text-rose-700',     swatch: 'bg-rose-400',     border: 'border-l-rose-400',     ring: 'ring-rose-400',     label: 'Rose' },
  { key: 'pink',     bg: 'bg-pink-100',     rowBg: 'bg-pink-50',     rowBgHover: 'hover:!bg-pink-100',     text: 'text-pink-700',     swatch: 'bg-pink-400',     border: 'border-l-pink-400',     ring: 'ring-pink-400',     label: 'Pink' },
  { key: 'fuchsia',  bg: 'bg-fuchsia-100',  rowBg: 'bg-fuchsia-50',  rowBgHover: 'hover:!bg-fuchsia-100',  text: 'text-fuchsia-700',  swatch: 'bg-fuchsia-400',  border: 'border-l-fuchsia-400',  ring: 'ring-fuchsia-400',  label: 'Fuchsia' },
  { key: 'purple',   bg: 'bg-purple-100',   rowBg: 'bg-purple-50',   rowBgHover: 'hover:!bg-purple-100',   text: 'text-purple-700',   swatch: 'bg-purple-400',   border: 'border-l-purple-400',   ring: 'ring-purple-400',   label: 'Purple' },
  { key: 'violet',   bg: 'bg-violet-100',   rowBg: 'bg-violet-50',   rowBgHover: 'hover:!bg-violet-100',   text: 'text-violet-700',   swatch: 'bg-violet-400',   border: 'border-l-violet-400',   ring: 'ring-violet-400',   label: 'Violet' },
  { key: 'indigo',   bg: 'bg-indigo-100',   rowBg: 'bg-indigo-50',   rowBgHover: 'hover:!bg-indigo-100',   text: 'text-indigo-700',   swatch: 'bg-indigo-400',   border: 'border-l-indigo-400',   ring: 'ring-indigo-400',   label: 'Indigo' },
  { key: 'blue',     bg: 'bg-blue-100',     rowBg: 'bg-blue-50',     rowBgHover: 'hover:!bg-blue-100',     text: 'text-blue-700',     swatch: 'bg-blue-400',     border: 'border-l-blue-400',     ring: 'ring-blue-400',     label: 'Blue' },
  { key: 'sky',      bg: 'bg-sky-100',      rowBg: 'bg-sky-50',      rowBgHover: 'hover:!bg-sky-100',      text: 'text-sky-700',      swatch: 'bg-sky-400',      border: 'border-l-sky-400',      ring: 'ring-sky-400',      label: 'Sky' },
  { key: 'cyan',     bg: 'bg-cyan-100',     rowBg: 'bg-cyan-50',     rowBgHover: 'hover:!bg-cyan-100',     text: 'text-cyan-700',     swatch: 'bg-cyan-400',     border: 'border-l-cyan-400',     ring: 'ring-cyan-400',     label: 'Cyan' },
  { key: 'teal',     bg: 'bg-teal-100',     rowBg: 'bg-teal-50',     rowBgHover: 'hover:!bg-teal-100',     text: 'text-teal-700',     swatch: 'bg-teal-400',     border: 'border-l-teal-400',     ring: 'ring-teal-400',     label: 'Teal' },
  { key: 'emerald',  bg: 'bg-emerald-100',  rowBg: 'bg-emerald-50',  rowBgHover: 'hover:!bg-emerald-100',  text: 'text-emerald-700',  swatch: 'bg-emerald-400',  border: 'border-l-emerald-400',  ring: 'ring-emerald-400',  label: 'Emerald' },
  { key: 'green',    bg: 'bg-green-100',    rowBg: 'bg-green-50',    rowBgHover: 'hover:!bg-green-100',    text: 'text-green-700',    swatch: 'bg-green-400',    border: 'border-l-green-400',    ring: 'ring-green-400',    label: 'Green' },
  { key: 'lime',     bg: 'bg-lime-100',     rowBg: 'bg-lime-50',     rowBgHover: 'hover:!bg-lime-100',     text: 'text-lime-700',     swatch: 'bg-lime-400',     border: 'border-l-lime-400',     ring: 'ring-lime-400',     label: 'Lime' },
  { key: 'yellow',   bg: 'bg-yellow-100',   rowBg: 'bg-yellow-50',   rowBgHover: 'hover:!bg-yellow-100',   text: 'text-yellow-700',   swatch: 'bg-yellow-400',   border: 'border-l-yellow-400',   ring: 'ring-yellow-400',   label: 'Yellow' },
  { key: 'amber',    bg: 'bg-amber-100',    rowBg: 'bg-amber-50',    rowBgHover: 'hover:!bg-amber-100',    text: 'text-amber-700',    swatch: 'bg-amber-400',    border: 'border-l-amber-400',    ring: 'ring-amber-400',    label: 'Amber' },
  { key: 'orange',   bg: 'bg-orange-100',   rowBg: 'bg-orange-50',   rowBgHover: 'hover:!bg-orange-100',   text: 'text-orange-700',   swatch: 'bg-orange-400',   border: 'border-l-orange-400',   ring: 'ring-orange-400',   label: 'Orange' },
];

export type PaletteEntry = (typeof PALETTE)[number];

export const PALETTE_KEYS = PALETTE.map((p) => p.key);
export const PALETTE_BY_KEY: Record<string, PaletteEntry> = Object.fromEntries(
  PALETTE.map((p) => [p.key, p]),
);

const HEX_RE = /^#[0-9a-f]{6}$/i;

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function isHex(value: string): boolean {
  return HEX_RE.test(value);
}

function isLightHex(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return r * 0.299 + g * 0.587 + b * 0.114 > 160;
}

export type GroupStyle =
  | {
      kind: 'palette';
      key: string;
      label: string;
      bgClass: string;
      rowBgClass: string;
      rowBgHoverClass: string;
      textClass: string;
      swatchClass: string;
      borderClass: string;
      ringClass: string;
    }
  | {
      kind: 'custom';
      key: string;
      label: string;
      hex: string;
      textHex: string;
    };

export function resolveColor(key: string): GroupStyle {
  if (isHex(key)) {
    return {
      kind: 'custom',
      key,
      label: key.toUpperCase(),
      hex: key,
      textHex: isLightHex(key) ? '#000000' : '#ffffff',
    };
  }
  const entry = PALETTE_BY_KEY[key] ?? PALETTE[0];
  return {
    kind: 'palette',
    key: entry.key,
    label: entry.label,
    bgClass: entry.bg,
    rowBgClass: entry.rowBg,
    rowBgHoverClass: entry.rowBgHover,
    textClass: entry.text,
    swatchClass: entry.swatch,
    borderClass: entry.border,
    ringClass: entry.ring,
  };
}

function fallbackKey(groupId: string): string {
  return PALETTE_KEYS[hashString(groupId) % PALETTE_KEYS.length];
}

export function getGroupColor(groupId: string, colorMap?: Record<string, string>): GroupStyle {
  const raw = colorMap?.[groupId];
  if (raw) return resolveColor(raw);
  return resolveColor(fallbackKey(groupId));
}

export function pickFreeColorKey(
  newGroupId: string,
  usedKeys: Iterable<string>,
): string {
  const used = new Set([...usedKeys].filter((k) => !isHex(k)));
  for (const k of PALETTE_KEYS) {
    if (!used.has(k)) return k;
  }
  return fallbackKey(newGroupId);
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
