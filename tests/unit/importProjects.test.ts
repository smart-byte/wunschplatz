import { describe, it, expect } from 'vitest';
import { parseProjectRows, parseGrades } from '@/excel/importProjects';

describe('parseGrades', () => {
  it('parses range "5-7"', () => {
    expect(parseGrades('5-7')).toEqual([5, 6, 7]);
  });

  it('parses en/em-dash ranges', () => {
    expect(parseGrades('5–7')).toEqual([5, 6, 7]);
    expect(parseGrades('5—7')).toEqual([5, 6, 7]);
  });

  it('parses comma-separated list', () => {
    expect(parseGrades('5, 6, 8')).toEqual([5, 6, 8]);
  });

  it('parses space-separated', () => {
    expect(parseGrades('7 8 9')).toEqual([7, 8, 9]);
  });

  it('parses semicolon-separated', () => {
    expect(parseGrades('5;6;7')).toEqual([5, 6, 7]);
  });

  it('strips brackets', () => {
    expect(parseGrades('[5,6,7]')).toEqual([5, 6, 7]);
  });

  it('returns [] for empty / dash', () => {
    expect(parseGrades('')).toEqual([]);
    expect(parseGrades('-')).toEqual([]);
    expect(parseGrades('—')).toEqual([]);
  });

  it('deduplicates and sorts', () => {
    expect(parseGrades('7,5,7,6')).toEqual([5, 6, 7]);
  });
});

describe('parseProjectRows', () => {
  it('parses valid rows', () => {
    const rows = [
      ['Name', 'Beschreibung', 'Jahrgänge', 'Max', 'Soll'],
      ['Schach', 'Eröffnungen', '5-13', 20, 16],
      ['Theater', 'Romeo + Julia', '7,8,9', 18, 14],
    ];
    const result = parseProjectRows(rows);
    expect(result.projects).toHaveLength(2);
    expect(result.projects[0].name).toBe('Schach');
    expect(result.projects[0].description).toBe('Eröffnungen');
    expect(result.projects[0].grades).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13]);
    expect(result.projects[0].maxCapacity).toBe(20);
    expect(result.projects[0].targetCapacity).toBe(16);
    expect(result.projects[1].grades).toEqual([7, 8, 9]);
    expect(result.errors).toHaveLength(0);
  });

  it('skips description column when absent', () => {
    const rows = [
      ['Name', 'Jahrgänge', 'Max', 'Soll'],
      ['Schach', '5-7', 20, 16],
    ];
    const result = parseProjectRows(rows);
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0].description).toBeUndefined();
  });

  it('returns missing-columns when headers do not match', () => {
    const rows = [
      ['Foo', 'Bar'],
      ['x', 'y'],
    ];
    const result = parseProjectRows(rows);
    expect(result.missingColumns).toContain('name');
    expect(result.missingColumns).toContain('grades');
    expect(result.missingColumns).toContain('maxCapacity');
    expect(result.missingColumns).toContain('targetCapacity');
    expect(result.projects).toHaveLength(0);
  });

  it('rejects rows without name', () => {
    const rows = [
      ['Name', 'Jahrgänge', 'Max', 'Soll'],
      ['', '5-7', 20, 16],
    ];
    const result = parseProjectRows(rows);
    expect(result.projects).toHaveLength(0);
    expect(result.errors.some((e) => /Name fehlt/.test(e.message))).toBe(true);
  });

  it('rejects rows with no valid grades', () => {
    const rows = [
      ['Name', 'Jahrgänge', 'Max', 'Soll'],
      ['Schach', '20-25', 20, 16], // all outside 5-13
    ];
    const result = parseProjectRows(rows);
    expect(result.projects).toHaveLength(0);
    expect(result.errors.some((e) => /Jahrgänge/i.test(e.message))).toBe(true);
  });

  it('rejects rows where Soll exceeds Max', () => {
    const rows = [
      ['Name', 'Jahrgänge', 'Max', 'Soll'],
      ['Schach', '5-7', 10, 15],
    ];
    const result = parseProjectRows(rows);
    expect(result.projects).toHaveLength(0);
    expect(result.errors.some((e) => /Soll/i.test(e.message))).toBe(true);
  });

  it('accepts alternative header names', () => {
    const rows = [
      ['Projekt', 'Stufen', 'Maximum', 'Ziel'],
      ['Schach', '5-7', 20, 16],
    ];
    const result = parseProjectRows(rows);
    expect(result.projects).toHaveLength(1);
    expect(result.missingColumns).toHaveLength(0);
  });
});
