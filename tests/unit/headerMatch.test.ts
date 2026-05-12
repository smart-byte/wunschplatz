import { describe, it, expect } from 'vitest';
import { detectColumns, type ColumnRole } from '@/excel/headerMatch';

describe('detectColumns', () => {
  it('matches German headers in order', () => {
    const headers = ['Vorname', 'Nachname', 'Klasse', 'Jahrgang', 'Prio1', 'Prio2', 'Prio3', 'Prio4', 'Prio5'];
    const result = detectColumns(headers);
    expect(result.firstName).toBe(0);
    expect(result.lastName).toBe(1);
    expect(result.className).toBe(2);
    expect(result.grade).toBe(3);
    expect(result.priorities).toEqual([4, 5, 6, 7, 8]);
  });

  it('matches case-insensitive and with whitespace', () => {
    const headers = [' VORNAME ', 'nachname', 'Klasse', 'jahrgang', 'PRIO1', 'prio2', 'PRIO 3', 'priorität 4', 'Priorität 5'];
    const result = detectColumns(headers);
    expect(result.firstName).toBe(0);
    expect(result.priorities[2]).toBe(6);
    expect(result.priorities[3]).toBe(7);
  });

  it('matches English headers', () => {
    const headers = ['first name', 'last name', 'class', 'grade', 'priority 1', 'priority 2', 'priority 3', 'priority 4', 'priority 5'];
    const result = detectColumns(headers);
    expect(result.firstName).toBe(0);
    expect(result.priorities).toEqual([4, 5, 6, 7, 8]);
  });

  it('returns -1 for missing columns', () => {
    const result = detectColumns(['Foo', 'Bar']);
    expect(result.firstName).toBe(-1);
    expect(result.lastName).toBe(-1);
    expect(result.priorities.every((p) => p === -1)).toBe(true);
  });

  it('returns missing role list', () => {
    const result = detectColumns(['Vorname']);
    const missing: ColumnRole[] = result.missingRequired();
    expect(missing).toContain('lastName');
    expect(missing).toContain('className');
    expect(missing).toContain('grade');
    expect(missing).toContain('priorities');
  });
});
