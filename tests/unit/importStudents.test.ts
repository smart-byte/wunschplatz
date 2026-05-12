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

  it('reports unknown project as error but keeps row', () => {
    const rows = [
      ['Vorname', 'Nachname', 'Klasse', 'Jahrgang', 'Prio1', 'Prio2'],
      ['Anna', 'Müller', '7a', '7', 'Alpha', 'Unknown'],
    ];
    const result = parseStudentRows(rows, projects);
    expect(result.students[0].priorities).toEqual(['a']);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].rowIndex).toBe(1);
    expect(result.errors[0].message).toContain('Unknown');
  });

  it('reports rows missing required fields and skips them', () => {
    const rows = [
      ['Vorname', 'Nachname', 'Klasse', 'Jahrgang', 'Prio1'],
      ['', 'Müller', '7a', '7', 'Alpha'],
    ];
    const result = parseStudentRows(rows, projects);
    expect(result.students).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toMatch(/Vorname/);
  });

  it('reports duplicate priorities as error', () => {
    const rows = [
      ['Vorname', 'Nachname', 'Klasse', 'Jahrgang', 'Prio1', 'Prio2'],
      ['Anna', 'Müller', '7a', '7', 'Alpha', 'Alpha'],
    ];
    const result = parseStudentRows(rows, projects);
    expect(result.errors.some((e) => /doppel/i.test(e.message))).toBe(true);
  });

  it('rejects grade out of range', () => {
    const rows = [
      ['Vorname', 'Nachname', 'Klasse', 'Jahrgang', 'Prio1'],
      ['Anna', 'Müller', '7a', '99', 'Alpha'],
    ];
    const result = parseStudentRows(rows, projects);
    expect(result.students).toHaveLength(0);
    expect(result.errors.some((e) => /Jahrgang/i.test(e.message))).toBe(true);
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
});
