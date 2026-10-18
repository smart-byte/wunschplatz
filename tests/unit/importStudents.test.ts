import { describe, it, expect } from 'vitest';
import { parseStudentRows } from '@/excel/importStudents';
import type { Project } from '@/types';

const projects: Project[] = [
  { id: 'a', name: 'Alpha', grades: [7], maxCapacity: 10, targetCapacity: 8 },
  { id: 'b', name: 'Beta', grades: [7], maxCapacity: 10, targetCapacity: 8 },
  { id: 'c', name: 'Gamma', grades: [7], maxCapacity: 10, targetCapacity: 8 },
  { id: 'd', name: 'Delta', grades: [7], maxCapacity: 10, targetCapacity: 8 },
  { id: 'e', name: 'Epsilon', grades: [7], maxCapacity: 10, targetCapacity: 8 },
];

describe('parseStudentRows', () => {
  it('keeps only the latest submission of a forms export', () => {
    const rows = [
      ['Zeitstempel', 'Vorname', 'Nachname', 'Klasse', 'Jahrgang', 'Prio1'],
      ['01.06.2026 09:30', 'Anna', 'Müller', '7a', '7', 'Beta'],
      ['01.06.2026 09:00', 'Ben', 'Kaya', '7a', '7', 'Alpha'],
      ['01.06.2026 09:00', 'Anna', 'Müller', '7a', '7', 'Alpha'],
    ];
    const result = parseStudentRows(rows, projects);
    expect(result.students.map((s) => [s.firstName, s.priorities])).toEqual([
      ['Anna', ['b']],
      ['Ben', ['a']],
    ]);
    expect(result.duplicatesRemoved).toBe(1);
  });

  it('warns about wishes outside the student grade but imports them', () => {
    const rows = [
      ['Vorname', 'Nachname', 'Klasse', 'Jahrgang', 'Prio1', 'Prio2'],
      ['Anna', 'Müller', '7a', '7', 'Alpha', 'Senior'],
    ];
    const senior = { id: 's', name: 'Senior', grades: [9], maxCapacity: 10, targetCapacity: 8 };
    const result = parseStudentRows(rows, [...projects, senior]);
    expect(result.students[0].priorities).toEqual(['a', 's']);
    expect(result.errors).toEqual([
      {
        rowIndex: 1,
        code: 'gradeMismatch',
        severity: 'warning',
        values: { priority: 2, name: 'Senior', grade: 7 },
      },
    ]);
  });

  it('parses valid rows', () => {
    const rows = [
      ['Vorname', 'Nachname', 'Klasse', 'Jahrgang', 'Prio1', 'Prio2', 'Prio3', 'Prio4', 'Prio5'],
      ['Anna', 'Müller', '7a', '7', 'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'],
    ];
    const result = parseStudentRows(rows, projects);
    expect(result.students).toHaveLength(1);
    expect(result.students[0].firstName).toBe('Anna');
    expect(result.students[0].priorities).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects the entire row when a project is unknown', () => {
    const rows = [
      ['Vorname', 'Nachname', 'Klasse', 'Jahrgang', 'Prio1', 'Prio2'],
      ['Anna', 'Müller', '7a', '7', 'Alpha', 'Unknown'],
    ];
    const result = parseStudentRows(rows, projects);
    expect(result.students).toEqual([]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].rowIndex).toBe(1);
    expect(result.errors[0]).toMatchObject({ code: 'unknownProject', values: { name: 'Unknown' } });
  });

  it('reports rows missing required fields and skips them', () => {
    const rows = [
      ['Vorname', 'Nachname', 'Klasse', 'Jahrgang', 'Prio1'],
      ['', 'Müller', '7a', '7', 'Alpha'],
    ];
    const result = parseStudentRows(rows, projects);
    expect(result.students).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe('firstNameMissing');
  });

  it('reports duplicate priorities as error', () => {
    const rows = [
      ['Vorname', 'Nachname', 'Klasse', 'Jahrgang', 'Prio1', 'Prio2'],
      ['Anna', 'Müller', '7a', '7', 'Alpha', 'Alpha'],
    ];
    const result = parseStudentRows(rows, projects);
    expect(result.errors.some((e) => e.code === 'duplicateProject')).toBe(true);
  });

  it('rejects grade out of range', () => {
    const rows = [
      ['Vorname', 'Nachname', 'Klasse', 'Jahrgang', 'Prio1'],
      ['Anna', 'Müller', '7a', '99', 'Alpha'],
    ];
    const result = parseStudentRows(rows, projects);
    expect(result.students).toHaveLength(0);
    expect(result.errors.some((e) => e.code === 'invalidGrade')).toBe(true);
  });

  it('returns missing-columns error when headers cannot be auto-detected', () => {
    const rows = [
      ['Foo', 'Bar'],
      ['x', 'y'],
    ];
    const result = parseStudentRows(rows, projects);
    expect(result.missingColumns.length).toBeGreaterThan(0);
    expect(result.students).toHaveLength(0);
  });

  it('treats dash placeholders (-, –, —) as empty priority cells', () => {
    const rows = [
      ['Vorname', 'Nachname', 'Klasse', 'Jahrgang', 'Prio1', 'Prio2', 'Prio3', 'Prio4', 'Prio5'],
      ['Anna', 'Müller', '7a', '7', 'Alpha', '-', 'Beta', '–', '—'],
    ];
    const result = parseStudentRows(rows, projects);
    expect(result.students).toHaveLength(1);
    expect(result.students[0].priorities).toEqual(['a', 'b']);
    expect(result.errors).toHaveLength(0);
  });

  it('groups students sharing the same Gruppe value', () => {
    const rows = [
      ['Vorname', 'Nachname', 'Klasse', 'Jahrgang', 'Gruppe', 'Prio1'],
      ['Anna', 'Müller', '7a', '7', '1', 'Alpha'],
      ['Ben', 'Schmidt', '7b', '7', '1', 'Alpha'],
      ['Carla', 'Weber', '7a', '7', '-', 'Beta'],
    ];
    const result = parseStudentRows(rows, projects);
    expect(result.students).toHaveLength(3);
    expect(result.students[0].groupId).toBeDefined();
    expect(result.students[0].groupId).toBe(result.students[1].groupId);
    expect(result.students[2].groupId).toBeUndefined();
  });

  it('singletons in Gruppe column are treated as ungrouped', () => {
    const rows = [
      ['Vorname', 'Nachname', 'Klasse', 'Jahrgang', 'Gruppe', 'Prio1'],
      ['Anna', 'Müller', '7a', '7', '5', 'Alpha'],
    ];
    const result = parseStudentRows(rows, projects);
    expect(result.students).toHaveLength(1);
    expect(result.students[0].groupId).toBeUndefined();
  });

  it('matches priority via prefix (e.g. "Yoga" → "Yogakurs")', () => {
    const projectsExt = [
      ...projects,
      { id: 'y', name: 'Yogakurs', grades: [7], maxCapacity: 10, targetCapacity: 8 },
    ];
    const rows = [
      ['Vorname', 'Nachname', 'Klasse', 'Jahrgang', 'Prio1'],
      ['Anna', 'Müller', '7a', '7', 'Yoga'],
    ];
    const result = parseStudentRows(rows, projectsExt);
    expect(result.errors).toHaveLength(0);
    expect(result.students[0].priorities).toEqual(['y']);
  });

  it('matches priority via word-boundary contains', () => {
    const projectsExt = [
      ...projects,
      { id: 'cz', name: 'Comicbuch zeichnen', grades: [7], maxCapacity: 10, targetCapacity: 8 },
    ];
    const rows = [
      ['Vorname', 'Nachname', 'Klasse', 'Jahrgang', 'Prio1'],
      ['Anna', 'Müller', '7a', '7', 'zeichnen'],
    ];
    const result = parseStudentRows(rows, projectsExt);
    expect(result.errors).toHaveLength(0);
    expect(result.students[0].priorities).toEqual(['cz']);
  });

  it('reports ambiguous when prefix matches multiple projects', () => {
    const projectsAmb = [
      { id: 'y1', name: 'Yoga und Meditation', grades: [7], maxCapacity: 10, targetCapacity: 8 },
      { id: 'y2', name: 'Yoga für Anfänger', grades: [7], maxCapacity: 10, targetCapacity: 8 },
    ];
    const rows = [
      ['Vorname', 'Nachname', 'Klasse', 'Jahrgang', 'Prio1'],
      ['Anna', 'Müller', '7a', '7', 'Yoga'],
    ];
    const result = parseStudentRows(rows, projectsAmb);
    expect(result.errors.some((e) => e.code === 'ambiguousProject')).toBe(true);
  });

  it('prefers exact match over prefix match', () => {
    const projectsExt = [
      { id: 'y1', name: 'Yoga', grades: [7], maxCapacity: 10, targetCapacity: 8 },
      { id: 'y2', name: 'Yogakurs', grades: [7], maxCapacity: 10, targetCapacity: 8 },
    ];
    const rows = [
      ['Vorname', 'Nachname', 'Klasse', 'Jahrgang', 'Prio1'],
      ['Anna', 'Müller', '7a', '7', 'Yoga'],
    ];
    const result = parseStudentRows(rows, projectsExt);
    expect(result.errors).toHaveLength(0);
    expect(result.students[0].priorities).toEqual(['y1']);
  });

  it('syncs group priorities to first member and warns on mismatch', () => {
    const rows = [
      ['Vorname', 'Nachname', 'Klasse', 'Jahrgang', 'Gruppe', 'Prio1', 'Prio2'],
      ['Anna', 'Müller', '7a', '7', '1', 'Alpha', 'Beta'],
      ['Ben', 'Schmidt', '7b', '7', '1', 'Gamma', 'Delta'],
    ];
    const result = parseStudentRows(rows, projects);
    expect(result.students[0].priorities).toEqual(['a', 'b']);
    expect(result.students[1].priorities).toEqual(['a', 'b']);
    expect(result.errors.some((e) => e.code === 'groupPrioritiesMismatch')).toBe(true);
  });
});
