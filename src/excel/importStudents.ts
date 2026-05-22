import { v4 as uuid } from 'uuid';
import { detectColumns, type ColumnRole } from './headerMatch';
import type { Project, Student } from '@/types';

export type ParseError = { rowIndex: number; message: string };
export type ParseResult = {
  students: Omit<Student, 'id'>[];
  errors: ParseError[];
  missingColumns: ColumnRole[];
};

type Pending = {
  firstName: string;
  lastName: string;
  className: string;
  grade: number;
  priorities: string[];
  groupKey: string | null;
  rowIndex: number;
};

function priosEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

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

  const errors: ParseError[] = [];
  const pending: Pending[] = [];

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

    // Group column (optional). Empty or dash → ungrouped.
    let groupKey: string | null = null;
    if (cols.group !== -1) {
      const raw = String(row[cols.group] ?? '').trim();
      if (raw && !/^[-–—]+$/.test(raw)) groupKey = raw;
    }

    pending.push({ firstName, lastName, className, grade, priorities, groupKey, rowIndex: r });
  }

  // Group resolution: map raw groupKey → uuid, sync priorities to first member,
  // collapse singletons to ungrouped.
  const membersByKey = new Map<string, Pending[]>();
  for (const p of pending) {
    if (!p.groupKey) continue;
    if (!membersByKey.has(p.groupKey)) membersByKey.set(p.groupKey, []);
    membersByKey.get(p.groupKey)!.push(p);
  }
  const groupIdByKey = new Map<string, string>();
  for (const [key, members] of membersByKey) {
    if (members.length >= 2) groupIdByKey.set(key, uuid());
  }

  const students: Omit<Student, 'id'>[] = [];
  for (const p of pending) {
    const groupId = p.groupKey ? groupIdByKey.get(p.groupKey) : undefined;
    if (groupId) {
      const members = membersByKey.get(p.groupKey!)!;
      const template = members[0];
      const sharedPriorities = template.priorities;
      if (p !== template && !priosEqual(p.priorities, sharedPriorities)) {
        errors.push({
          rowIndex: p.rowIndex,
          message: `Gruppe "${p.groupKey}": Prios weichen ab — übernommen von ${template.firstName} ${template.lastName}`,
        });
      }
      students.push({
        firstName: p.firstName,
        lastName: p.lastName,
        className: p.className,
        grade: p.grade,
        priorities: sharedPriorities,
        groupId,
      });
    } else {
      // Singleton group (only one member) or no group key → ungrouped.
      students.push({
        firstName: p.firstName,
        lastName: p.lastName,
        className: p.className,
        grade: p.grade,
        priorities: p.priorities,
      });
    }
  }

  return { students, errors, missingColumns: [] };
}
