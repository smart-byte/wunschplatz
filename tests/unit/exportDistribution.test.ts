import { describe, it, expect } from 'vitest';
import { utils, read, write } from 'xlsx';
import { buildExportWorkbook } from '@/excel/exportDistribution';
import type { Project, Student, Assignment } from '@/types';

const projects: Project[] = [
  { id: 'a', name: 'Alpha', grades: [7], maxCapacity: 5, targetCapacity: 3 },
  { id: 'b', name: 'Beta', grades: [7], maxCapacity: 5, targetCapacity: 3 },
];
const students: Student[] = [
  { id: 's1', firstName: 'Anna', lastName: 'Müller', className: '7a', grade: 7, priorities: ['a', 'b'] },
];
const assignments: Assignment[] = [
  { studentId: 's1', projectId: 'a', priorityRank: 1, manuallyEdited: false },
];

describe('buildExportWorkbook', () => {
  it('returns workbook with Verteilung and Projekte sheets', () => {
    const wb = buildExportWorkbook(students, projects, assignments);
    expect(wb.SheetNames).toContain('Verteilung');
    expect(wb.SheetNames).toContain('Projekte');
    const verteilungRows = utils.sheet_to_json(wb.Sheets['Verteilung']);
    expect(verteilungRows).toHaveLength(1);
    const row = verteilungRows[0] as Record<string, unknown>;
    expect(row['Vorname']).toBe('Anna');
    expect(row['Zugewiesenes Projekt']).toBe('Alpha');
    expect(row['Erfüllte Prio']).toBe(1);
  });

  it('survives round-trip through xlsx binary', () => {
    const wb = buildExportWorkbook(students, projects, assignments);
    const buffer = write(wb, { type: 'buffer', bookType: 'xlsx' }) as Uint8Array;
    const out = read(buffer);
    expect(out.SheetNames).toContain('Verteilung');
    expect(out.SheetNames).toContain('Projekte');
  });
});
