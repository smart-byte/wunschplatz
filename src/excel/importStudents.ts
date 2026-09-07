import { v4 as uuid } from 'uuid';
import { detectColumns, type ColumnRole } from './headerMatch';
import type { Project, Student } from '@/types';
import { normalizeLabel } from '@/forms/normalizeLabel';

import {
  parseStudentIdentity,
  parsePriorities,
  studentImportError,
  type ParseError,
} from './studentValidation';
export {
  studentImportError,
  type ParseError,
  type StudentImportErrorCode,
} from './studentValidation';
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

export function findProjectByName(
  name: string,
  projects: Project[],
): { ok: true; id: string } | { ok: false; reason: 'unknown' | 'ambiguous'; candidates: string[] } {
  const n = normalizeLabel(name);
  const exact = projects.filter((p) => normalizeLabel(p.name) === n);
  if (exact.length === 1) return { ok: true, id: exact[0].id };
  if (exact.length > 1)
    return { ok: false, reason: 'ambiguous', candidates: exact.map((p) => p.name) };
  const prefix = projects.filter((p) => normalizeLabel(p.name).startsWith(n));
  if (prefix.length === 1) return { ok: true, id: prefix[0].id };
  if (prefix.length > 1)
    return { ok: false, reason: 'ambiguous', candidates: prefix.map((p) => p.name) };
  const word = projects.filter((p) =>
    normalizeLabel(p.name)
      .split(/[\s\-:,/]+/)
      .includes(n),
  );
  if (word.length === 1) return { ok: true, id: word[0].id };
  if (word.length > 1)
    return { ok: false, reason: 'ambiguous', candidates: word.map((p) => p.name) };
  return { ok: false, reason: 'unknown', candidates: [] };
}

export function parseStudentRows(rows: unknown[][], projects: Project[]): ParseResult {
  if (rows.length === 0) {
    return {
      students: [],
      errors: [],
      missingColumns: ['firstName', 'lastName', 'className', 'grade', 'priorities'],
    };
  }
  const headers = rows[0].map((h) => String(h ?? ''));
  const cols = detectColumns(headers);
  const missingColumns = cols.missingRequired();
  if (missingColumns.length > 0) {
    return { students: [], errors: [], missingColumns };
  }

  const errors: ParseError[] = [];
  const pending: Pending[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((cell) => String(cell ?? '').trim() === '')) continue;
    const identity = parseStudentIdentity(
      [row[cols.firstName], row[cols.lastName], row[cols.className], row[cols.grade]],
      r,
      errors,
    );
    if (!identity) continue;
    const priorities = parsePriorities(
      cols.priorities.map((i) => row[i]),
      r,
      errors,
      (name) => findProjectByName(name, projects),
    );
    if (!priorities) continue;

    let groupKey: string | null = null;
    if (cols.group !== -1) {
      const raw = String(row[cols.group] ?? '').trim();
      if (raw && !/^[-–—]+$/.test(raw)) groupKey = raw;
    }

    pending.push({ ...identity, priorities, groupKey, rowIndex: r });
  }

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
        errors.push(
          studentImportError(p.rowIndex, 'groupPrioritiesMismatch', {
            group: p.groupKey!,
            name: `${template.firstName} ${template.lastName}`,
          }),
        );
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
