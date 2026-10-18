import { describe, it, expect } from 'vitest';
import { parseFormResponses } from '@/forms/importFormResponses';
import { buildBlueprint } from '@/forms/buildBlueprint';
import type { Project } from '@/types';

const projects: Project[] = [
  { id: 'p0', name: 'Schach', grades: [7], maxCapacity: 10, targetCapacity: 8 },
  { id: 'p1', name: 'Yoga', grades: [7], maxCapacity: 10, targetCapacity: 8 },
  { id: 'p2', name: 'Comic', grades: [7], maxCapacity: 10, targetCapacity: 8 },
  { id: 'p3', name: 'Theater', grades: [7], maxCapacity: 10, targetCapacity: 8 },
  { id: 'p4', name: 'Kochen', grades: [7], maxCapacity: 10, targetCapacity: 8 },
];
const bp = (() => {
  const r = buildBlueprint(projects, 'x');
  if (!r.ok) throw new Error();
  return r.blueprint;
})();
const HEADERS = [
  'Zeitstempel',
  'Vorname',
  'Nachname',
  'Klasse',
  'Jahrgang',
  '1. Wahl',
  '2. Wahl',
  '3. Wahl',
  '4. Wahl',
  '5. Wahl',
];

describe('parseFormResponses', () => {
  it('warns about wishes outside the student grade but imports them', () => {
    const mixed = projects.map((p) => (p.id === 'p1' ? { ...p, grades: [9] } : p));
    const rows = [HEADERS, ['01.06.2026 09:00', 'Ada', 'Lovelace', '7a', '7', 'Schach', 'Yoga']];
    const res = parseFormResponses(rows, mixed, bp);
    expect(res.students[0].priorities).toEqual(['p0', 'p1']);
    expect(res.errors).toEqual([
      {
        rowIndex: 1,
        code: 'gradeMismatch',
        severity: 'warning',
        values: { priority: 2, name: 'Yoga', grade: 7 },
      },
    ]);
  });

  it('imports a two-choice response from a two-project blueprint', () => {
    const smallProjects = projects.slice(0, 2);
    const built = buildBlueprint(smallProjects, 'x');
    if (!built.ok) throw new Error();
    const rows = [
      ['Zeitstempel', 'Vorname', 'Nachname', 'Klasse', 'Jahrgang', '1. Wahl', '2. Wahl'],
      ['01.06.2026 09:00', 'Ada', 'Lovelace', '7a', '7', 'Schach', 'Yoga'],
    ];
    const res = parseFormResponses(rows, smallProjects, built.blueprint);
    expect(res.errors).toEqual([]);
    expect(res.missingColumns).toEqual([]);
    expect(res.students[0].priorities).toEqual(['p0', 'p1']);
  });

  it('maps a clean response to a student via blueprint labels', () => {
    const rows = [
      HEADERS,
      [
        '01.06.2026 09:00',
        'Anna',
        'Müller',
        '7a',
        '7',
        'Schach',
        'Yoga',
        'Comic',
        'Theater',
        'Kochen',
      ],
    ];
    const res = parseFormResponses(rows, projects, bp);
    expect(res.errors).toEqual([]);
    expect(res.students).toHaveLength(1);
    expect(res.students[0]).toMatchObject({
      firstName: 'Anna',
      lastName: 'Müller',
      className: '7a',
      grade: 7,
      priorities: ['p0', 'p1', 'p2', 'p3', 'p4'],
    });
  });

  it('dedups double submissions, keeping the latest by timestamp', () => {
    const rows = [
      HEADERS,
      [
        '01.06.2026 09:00',
        'Anna',
        'Müller',
        '7a',
        '7',
        'Schach',
        'Yoga',
        'Comic',
        'Theater',
        'Kochen',
      ],
      [
        '01.06.2026 11:00',
        'Anna',
        'Müller',
        '7a',
        '7',
        'Kochen',
        'Yoga',
        'Comic',
        'Theater',
        'Schach',
      ],
    ];
    const res = parseFormResponses(rows, projects, bp);
    expect(res.duplicatesRemoved).toBe(1);
    expect(res.students).toHaveLength(1);
    expect(res.students[0].priorities[0]).toBe('p4');
  });

  it('dedup runs before validation: a discarded invalid older row does not block the valid kept row', () => {
    const rows = [
      HEADERS,
      ['01.06.2026 09:00', 'Anna', 'Müller', '7a', '7', 'Tippfehlerprojekt', '', '', '', ''],
      [
        '01.06.2026 11:00',
        'Anna',
        'Müller',
        '7a',
        '7',
        'Schach',
        'Yoga',
        'Comic',
        'Theater',
        'Kochen',
      ],
    ];
    const res = parseFormResponses(rows, projects, bp);
    expect(res.students).toHaveLength(1);
    expect(res.errors).toEqual([]);
  });

  it('resolves a renamed project via projectId (blueprint label → id → current name)', () => {
    const renamed = projects.map((p) => (p.id === 'p0' ? { ...p, name: 'Schach AG' } : p));
    const rows = [
      HEADERS,
      ['01.06.2026 09:00', 'Ben', 'S', '7b', '7', 'Schach', 'Yoga', 'Comic', 'Theater', 'Kochen'],
    ];
    const res = parseFormResponses(rows, renamed, bp);
    expect(res.errors).toEqual([]);
    expect(res.students[0].priorities[0]).toBe('p0');
  });

  it('flags a per-row error when a chosen project was deleted', () => {
    const fewer = projects.filter((p) => p.id !== 'p0');
    const rows = [
      HEADERS,
      ['01.06.2026 09:00', 'Ben', 'S', '7b', '7', 'Schach', 'Yoga', 'Comic', 'Theater', 'Kochen'],
    ];
    const res = parseFormResponses(rows, fewer, bp);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.errors[0].rowIndex).toBe(1);
  });

  it('does not silently reassign a deleted project to a same-prefixed sibling', () => {
    const projs = [
      ...projects.filter((p) => p.id !== 'p0'),
      { id: 'p5', name: 'Schachclub', grades: [7], maxCapacity: 10, targetCapacity: 8 },
    ];
    const rows = [
      HEADERS,
      ['01.06.2026 09:00', 'Ben', 'S', '7b', '7', 'Schach', 'Yoga', 'Comic', 'Theater', 'Kochen'],
    ];
    const res = parseFormResponses(rows, projs, bp);
    expect(res.errors.some((e) => e.code === 'deletedProject')).toBe(true);
    expect(res.students).toEqual([]);
  });

  it('imports a project added after the blueprint via fuzzy fallback', () => {
    const projs = [
      ...projects,
      { id: 'p5', name: 'Zirkus', grades: [7], maxCapacity: 10, targetCapacity: 8 },
    ];
    const rows = [
      HEADERS,
      ['01.06.2026 09:00', 'Ann', 'Z', '7a', '7', 'Zirkus', 'Yoga', 'Comic', 'Theater', 'Kochen'],
    ];
    const res = parseFormResponses(rows, projs, bp);
    expect(res.errors).toEqual([]);
    expect(res.students[0].priorities[0]).toBe('p5');
  });

  it('fuzzy-resolves a blueprint-absent label via shared normalization (case + whitespace)', () => {
    const projs = [
      ...projects,
      { id: 'p5', name: 'Comic Buch', grades: [7], maxCapacity: 10, targetCapacity: 8 },
    ];
    const rows = [
      HEADERS,
      ['01.06.2026 09:00', 'X', 'Y', '7a', '7', 'COMIC   BUCH', 'Yoga', 'Theater', 'Kochen', ''],
    ];
    const res = parseFormResponses(rows, projs, bp);
    expect(res.errors).toEqual([]);
    expect(res.students[0].priorities[0]).toBe('p5');
  });

  it('keeps projectId authority when a rename causes a name collision (HIGH)', () => {
    const collided = projects.map((p) => (p.id === 'p0' ? { ...p, name: 'Yoga' } : p));
    const rows = [
      HEADERS,
      ['01.06.2026 09:00', 'Ben', 'S', '7b', '7', 'Schach', 'Comic', 'Theater', 'Kochen', ''],
    ];
    const res = parseFormResponses(rows, collided, bp);
    expect(res.errors).toEqual([]);
    expect(res.students[0].priorities[0]).toBe('p0');
  });

  it('prefers completion time over start time for dedup (MS export order)', () => {
    const msHeaders = [
      'Startzeit',
      'Abschlusszeit',
      'Vorname',
      'Nachname',
      'Klasse',
      'Jahrgang',
      '1. Wahl',
      '2. Wahl',
      '3. Wahl',
      '4. Wahl',
      '5. Wahl',
    ];
    const rows = [
      msHeaders,
      [
        '01.06.2026 08:00',
        '01.06.2026 12:00',
        'Anna',
        'Müller',
        '7a',
        '7',
        'Kochen',
        'Yoga',
        'Comic',
        'Theater',
        'Schach',
      ],
      [
        '01.06.2026 09:00',
        '01.06.2026 09:05',
        'Anna',
        'Müller',
        '7a',
        '7',
        'Schach',
        'Yoga',
        'Comic',
        'Theater',
        'Kochen',
      ],
    ];
    const res = parseFormResponses(rows, projects, bp);
    expect(res.duplicatesRemoved).toBe(1);
    expect(res.students[0].priorities[0]).toBe('p4');
  });

  it('does not merge two same-named students in different Jahrgang', () => {
    const rows = [
      HEADERS,
      [
        '01.06.2026 09:00',
        'Anna',
        'Müller',
        '7a',
        '7',
        'Schach',
        'Yoga',
        'Comic',
        'Theater',
        'Kochen',
      ],
      [
        '01.06.2026 09:00',
        'Anna',
        'Müller',
        '7a',
        '8',
        'Yoga',
        'Schach',
        'Comic',
        'Theater',
        'Kochen',
      ],
    ];
    const res = parseFormResponses(rows, projects, bp);
    expect(res.duplicatesRemoved).toBe(0);
    expect(res.students).toHaveLength(2);
  });

  it('reports missing required column instead of partial import', () => {
    const badHeaders = ['Zeitstempel', 'Rufname', 'Nachname', 'Klasse', 'Jahrgang', '1. Wahl'];
    const rows = [badHeaders, ['01.06.2026', 'A', 'B', '7a', '7', 'Schach']];
    const res = parseFormResponses(rows, projects, bp);
    expect(res.missingColumns).toContain('firstName');
    expect(res.students).toEqual([]);
  });
});
