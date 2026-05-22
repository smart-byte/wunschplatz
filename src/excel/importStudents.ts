import { detectColumns, type ColumnRole } from './headerMatch';
import type { Project, Student } from '@/types';

export type ParseError = { rowIndex: number; message: string };
export type ParseResult = {
  students: Omit<Student, 'id'>[];
  errors: ParseError[];
  missingColumns: ColumnRole[];
};

export function parseStudentRows(rows: unknown[][], projects: Project[]): ParseResult {
  if (rows.length === 0) {
    return { students: [], errors: [], missingColumns: ['firstName', 'lastName', 'className', 'grade', 'priorities'] };
  }
  const headers = rows[0].map((h) => String(h ?? ''));
  const cols = detectColumns(headers);
  const missingColumns = cols.missingRequired();
  if (missingColumns.length > 0) {
    return { students: [], errors: [], missingColumns };
  }

  const projectByName = new Map<string, string>();
  for (const p of projects) projectByName.set(p.name.toLowerCase().trim(), p.id);

  const students: Omit<Student, 'id'>[] = [];
  const errors: ParseError[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const firstName = String(row[cols.firstName] ?? '').trim();
    const lastName = String(row[cols.lastName] ?? '').trim();
    const className = String(row[cols.className] ?? '').trim();
    const gradeRaw = row[cols.grade];
    const grade = typeof gradeRaw === 'number' ? gradeRaw : parseInt(String(gradeRaw ?? ''), 10);

    if (!firstName) { errors.push({ rowIndex: r, message: 'Vorname fehlt' }); continue; }
    if (!lastName) { errors.push({ rowIndex: r, message: 'Nachname fehlt' }); continue; }
    if (!className) { errors.push({ rowIndex: r, message: 'Klasse fehlt' }); continue; }
    if (isNaN(grade) || grade < 5 || grade > 13) {
      errors.push({ rowIndex: r, message: `Jahrgang ungültig (${gradeRaw})` }); continue;
    }

    const priorities: string[] = [];
    const seen = new Set<string>();
    let priorityError = false;
    for (let k = 0; k < 5; k++) {
      const colIdx = cols.priorities[k];
      if (colIdx === -1) continue;
      const name = String(row[colIdx] ?? '').trim();
      // Treat empty cells, dashes (-, –, —), and similar placeholders as "no choice".
      if (!name || /^[-–—]+$/.test(name)) continue;
      const id = projectByName.get(name.toLowerCase());
      if (!id) {
        errors.push({ rowIndex: r, message: `Prio${k + 1}: Unbekanntes Projekt "${name}"` });
        continue;
      }
      if (seen.has(id)) {
        errors.push({ rowIndex: r, message: `Prio${k + 1}: Doppeltes Projekt "${name}"` });
        priorityError = true;
        continue;
      }
      seen.add(id);
      priorities.push(id);
    }

    if (priorityError && priorities.length === 0) continue;

    students.push({ firstName, lastName, className, grade, priorities });
  }

  return { students, errors, missingColumns: [] };
}
