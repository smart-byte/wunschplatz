import { describe, it, expect } from 'vitest';
import { utils, read, write } from 'xlsx';
import { buildProjectsWorkbook } from '@/excel/exportProjects';
import { buildStudentsWorkbook } from '@/excel/exportStudents';
import { parseProjectRows } from '@/excel/importProjects';
import { parseStudentRows } from '@/excel/importStudents';
import type { Project, Student } from '@/types';

function roundtripWorkbook(wb: ReturnType<typeof buildProjectsWorkbook>) {
  const buf = write(wb, { type: 'buffer', bookType: 'xlsx' }) as Uint8Array;
  return read(buf);
}

describe('Projects export → import roundtrip', () => {
  it('preserves all fields', () => {
    const projects: Project[] = [
      { id: 'a', name: 'Schach', description: 'Eröffnungen', grades: [5, 6, 7], maxCapacity: 20, targetCapacity: 16 },
      { id: 'b', name: 'Theater', grades: [7, 8, 9], maxCapacity: 18, targetCapacity: 14 },
    ];
    const wb = buildProjectsWorkbook(projects);
    const out = roundtripWorkbook(wb);
    const rows = utils.sheet_to_json<unknown[]>(out.Sheets['Projekte'], { header: 1, defval: '' });
    const parsed = parseProjectRows(rows as unknown[][]);

    expect(parsed.missingColumns).toHaveLength(0);
    expect(parsed.errors).toHaveLength(0);
    expect(parsed.projects).toHaveLength(2);
    expect(parsed.projects[0]).toMatchObject({
      name: 'Schach',
      description: 'Eröffnungen',
      grades: [5, 6, 7],
      maxCapacity: 20,
      targetCapacity: 16,
    });
    expect(parsed.projects[1].description).toBeUndefined();
  });
});

describe('Students export → import roundtrip', () => {
  it('preserves all fields and groups', () => {
    const projects: Project[] = [
      { id: 'a', name: 'Alpha', grades: [7], maxCapacity: 10, targetCapacity: 8 },
      { id: 'b', name: 'Beta', grades: [7], maxCapacity: 10, targetCapacity: 8 },
    ];
    const students: Student[] = [
      { id: 's1', firstName: 'Anna', lastName: 'Müller', className: '7a', grade: 7, priorities: ['a', 'b'], groupId: 'g1' },
      { id: 's2', firstName: 'Ben', lastName: 'Schmidt', className: '7b', grade: 7, priorities: ['a', 'b'], groupId: 'g1' },
      { id: 's3', firstName: 'Carla', lastName: 'Weber', className: '7a', grade: 7, priorities: ['b'] },
    ];
    const wb = buildStudentsWorkbook(students, projects);
    const out = roundtripWorkbook(wb);
    const rows = utils.sheet_to_json<unknown[]>(out.Sheets['Schüler'], { header: 1, defval: '' });
    const parsed = parseStudentRows(rows as unknown[][], projects);

    expect(parsed.missingColumns).toHaveLength(0);
    expect(parsed.errors).toHaveLength(0);
    expect(parsed.students).toHaveLength(3);
    // Anna + Ben share a group, Carla is alone.
    expect(parsed.students[0].groupId).toBeDefined();
    expect(parsed.students[0].groupId).toBe(parsed.students[1].groupId);
    expect(parsed.students[2].groupId).toBeUndefined();
    expect(parsed.students[0].priorities).toEqual(['a', 'b']);
    expect(parsed.students[2].priorities).toEqual(['b']);
  });
});
