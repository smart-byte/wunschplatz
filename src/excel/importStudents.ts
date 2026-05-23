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

  /**
   * Match a prio cell value to a project. Tries exact, then prefix
   * ("Yoga" → "Yogakurs"), then word-boundary ("Comic" → "Comicbuch zeichnen").
   * Returns ambiguous if more than one candidate matches at the same level.
   */
  function findProject(
    name: string,
  ): { ok: true; id: string } | { ok: false; reason: 'unknown' | 'ambiguous'; candidates: string[] } {
    const n = name.toLowerCase().trim();
    // Exact match (case-insensitive)
    const exact = projectByName.get(n);
    if (exact) return { ok: true, id: exact };
    // Prefix match: project name starts with the prio value
    const prefix = projects.filter((p) => p.name.toLowerCase().trim().startsWith(n));
    if (prefix.length === 1) return { ok: true, id: prefix[0].id };
    if (prefix.length > 1) return { ok: false, reason: 'ambiguous', candidates: prefix.map((p) => p.name) };
    // Word-boundary contains: project contains the prio value as a separate word
    const word = projects.filter((p) => {
      const words = p.name.toLowerCase().split(/[\s\-:,/]+/);
      return words.includes(n);
    });
    if (word.length === 1) return { ok: true, id: word[0].id };
    if (word.length > 1) return { ok: false, reason: 'ambiguous', candidates: word.map((p) => p.name) };
    return { ok: false, reason: 'unknown', candidates: [] };
  }

  const errors: ParseError[] = [];
  const pending: Pending[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    // Skip fully empty rows silently — no error noise from trailing blanks.
    if (!row || row.every((cell) => String(cell ?? '').trim() === '')) continue;
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
      const match = findProject(name);
      if (!match.ok) {
        const msg = match.reason === 'ambiguous'
          ? `Prio${k + 1}: "${name}" passt zu mehreren Projekten (${match.candidates.join(', ')})`
          : `Prio${k + 1}: Unbekanntes Projekt "${name}"`;
        errors.push({ rowIndex: r, message: msg });
        continue;
      }
      const id = match.id;
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
