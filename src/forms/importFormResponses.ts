import type { Project, Student, FormBlueprint } from '@/types';
import type { ParseResult, ParseError } from '@/excel/importStudents';
import { findProjectByName } from '@/excel/importStudents';
import { parseStudentIdentity, parsePriorities } from '@/excel/studentValidation';
import { resolveFormColumns } from './resolveFormColumns';
import { parseTimestamp } from './parseTimestamp';
import { normalizeLabel } from './normalizeLabel';

export type FormImportResult = ParseResult & {
  warnings: Array<{ code: 'heuristicColumn'; values: { expected: string; actual: string } }>;
  duplicatesRemoved: number;
};

// Prefer completion time even when Microsoft Forms puts start time first.
const TIMESTAMP_HEADERS = [
  'timestamp',
  'zeitstempel',
  'completion time',
  'abschlusszeit',
  'start time',
  'startzeit',
];

export function parseFormResponses(
  rows: unknown[][],
  projects: Project[],
  blueprint: FormBlueprint,
): FormImportResult {
  if (rows.length === 0) {
    return {
      students: [],
      errors: [],
      missingColumns: ['firstName', 'lastName', 'className', 'grade', 'priorities'],
      warnings: [],
      duplicatesRemoved: 0,
    };
  }

  const headers = rows[0].map((h) => String(h ?? ''));
  const cols = resolveFormColumns(headers, blueprint);
  if (cols.missingRequired.length > 0) {
    return {
      students: [],
      errors: [],
      missingColumns: cols.missingRequired,
      warnings: cols.warnings,
      duplicatesRemoved: 0,
    };
  }

  const normalizedHeaders = headers.map((h) => h.trim().toLocaleLowerCase('de'));
  const tsIdx =
    TIMESTAMP_HEADERS.map((name) => normalizedHeaders.indexOf(name)).find((i) => i >= 0) ?? -1;

  // Blueprint IDs preserve choices across project renames and name collisions.
  const idByLabel = new Map<string, string>();
  for (const o of blueprint.projectOptions) idByLabel.set(normalizeLabel(o.label), o.projectId);
  const existingIds = new Set(projects.map((p) => p.id));

  type Row = { cells: unknown[]; rowIndex: number; ts: number | null };
  const body: Row[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => String(c ?? '').trim() === '')) continue;
    body.push({ cells: row, rowIndex: r, ts: tsIdx === -1 ? null : parseTimestamp(row[tsIdx]) });
  }

  // Discard superseded responses before validation, including their errors.
  const keyOf = (row: unknown[]) =>
    [cols.firstName, cols.lastName, cols.className, cols.grade]
      .map((i) => normalizeLabel(String(row[i] ?? '')))
      .join('\u0000');
  const kept = new Map<string, Row>();
  let duplicatesRemoved = 0;
  for (const row of body) {
    const k = keyOf(row.cells);
    const prev = kept.get(k);
    if (!prev) {
      kept.set(k, row);
      continue;
    }
    duplicatesRemoved++;
    kept.set(k, pickLatest(prev, row));
  }

  const keptRows = [...kept.values()].sort((a, b) => a.rowIndex - b.rowIndex);
  const students: Omit<Student, 'id'>[] = [];
  const errors: ParseError[] = [];

  for (const row of keptRows) {
    const c = row.cells;
    const identity = parseStudentIdentity(
      [c[cols.firstName], c[cols.lastName], c[cols.className], c[cols.grade]],
      row.rowIndex,
      errors,
    );
    if (!identity) continue;
    const priorities = parsePriorities(
      cols.priorities.map((i) => c[i]),
      row.rowIndex,
      errors,
      (name) => {
        const known = idByLabel.get(normalizeLabel(name));
        if (known !== undefined)
          return existingIds.has(known)
            ? { ok: true, id: known }
            : { ok: false, reason: 'deleted' };
        return findProjectByName(name, projects);
      },
    );
    if (priorities) students.push({ ...identity, priorities });
  }

  return { students, errors, missingColumns: [], warnings: cols.warnings, duplicatesRemoved };
}

function pickLatest<T extends { ts: number | null }>(a: T, b: T): T {
  if (a.ts === null) return b;
  if (b.ts === null) return a;
  return b.ts >= a.ts ? b : a;
}
