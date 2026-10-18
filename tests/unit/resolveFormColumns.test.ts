import { describe, it, expect } from 'vitest';
import { resolveFormColumns } from '@/forms/resolveFormColumns';
import { buildBlueprint } from '@/forms/buildBlueprint';
import type { Project } from '@/types';

const projects: Project[] = Array.from({ length: 5 }, (_, i) => ({
  id: `p${i}`,
  name: `Projekt ${i}`,
  grades: [7],
  maxCapacity: 10,
  targetCapacity: 8,
}));
const bp = (() => {
  const r = buildBlueprint(projects, 'x');
  if (!r.ok) throw new Error('bp');
  return r.blueprint;
})();

describe('resolveFormColumns', () => {
  it('maps by exact blueprint title (plus Forms extra columns ignored)', () => {
    const headers = [
      'Zeitstempel',
      'E-Mail',
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
    const c = resolveFormColumns(headers, bp);
    expect([c.firstName, c.lastName, c.className, c.grade]).toEqual([2, 3, 4, 5]);
    expect(c.priorities).toEqual([6, 7, 8, 9, 10]);
    expect(c.missingRequired).toEqual([]);
    expect(c.warnings).toEqual([]);
  });

  it('falls back to fuzzy match (with warning) when a title was edited', () => {
    const headers = [
      'First Name',
      'Nachname',
      'Klasse',
      'Jahrgang',
      '1. Wahl',
      '2. Wahl',
      '3. Wahl',
      '4. Wahl',
      '5. Wahl',
    ];
    const c = resolveFormColumns(headers, bp);
    expect(c.firstName).toBe(0);
    expect(c.warnings.length).toBe(1);
    expect(c.missingRequired).toEqual([]);
  });

  it('never reads the MS Forms account Name column as the last name', () => {
    const headers = ['Name', 'Vorname', 'Familienname', 'Klasse', 'Jahrgang'];
    const c = resolveFormColumns(headers.concat(bp.priorities.map((q) => q.title)), bp);
    expect(c.lastName).toBe(-1);
    expect(c.missingRequired).toContain('lastName');
  });

  it('reports a required column missing when neither exact nor fuzzy matches', () => {
    const headers = ['Rufname', 'Nachname', 'Klasse', 'Jahrgang', '1. Wahl'];
    const c = resolveFormColumns(headers, bp);
    expect(c.missingRequired).toContain('firstName');
  });

  it('flags missing priorities when only ONE Wahl column is unresolvable', () => {
    const headers = [
      'Vorname',
      'Nachname',
      'Klasse',
      'Jahrgang',
      '1. Wahl',
      '2. Wahl',
      'Lieblingsfach',
      '4. Wahl',
      '5. Wahl',
    ];
    const c = resolveFormColumns(headers, bp);
    expect(c.missingRequired).toContain('priorities');
  });
});
