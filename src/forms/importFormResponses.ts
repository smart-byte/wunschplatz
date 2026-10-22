import type { Project, Student, FormBlueprint } from '@/types';
import type { ParseResult } from '@/excel/importStudents';
import { findProjectByName } from '@/excel/importStudents';
import {
  parseStudentIdentity,
  parsePriorities,
  studentImportError,
  warnGradeMismatches,
} from '@/excel/studentValidation';
import { resolveFormColumns } from './resolveFormColumns';
import { duplicateHeadings } from '@/excel/headerMatch';
import { findTimestampColumn, keepLatestResponses, responseRows } from './dedupeResponses';
import { normalizeLabel } from './normalizeLabel';

export type FormImportResult = ParseResult & {
  warnings: Array<{ code: 'heuristicColumn'; values: { expected: string; actual: string } }>;
};

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
  const duplicates = duplicateHeadings(headers, [
    cols.firstName,
    cols.lastName,
    cols.className,
    cols.grade,
    ...cols.priorities,
  ]);
  if (duplicates.length > 0) {
    return {
      students: [],
      errors: duplicates.map((column) => studentImportError(0, 'duplicateColumn', { column })),
      missingColumns: [],
      warnings: cols.warnings,
      duplicatesRemoved: 0,
    };
  }

  // Blueprint IDs preserve choices across project renames and name collisions.
  const idByLabel = new Map<string, string>();
  for (const o of blueprint.projectOptions) idByLabel.set(normalizeLabel(o.label), o.projectId);
  const existingIds = new Set(projects.map((p) => p.id));

  // Discard superseded responses before validation, including their errors.
  const { responses, duplicatesRemoved, undatedRows } = keepLatestResponses(
    responseRows(rows),
    [cols.firstName, cols.lastName, cols.className, cols.grade],
    findTimestampColumn(headers),
  );

  const students: Omit<Student, 'id'>[] = [];
  const errors = undatedRows.map((r) => studentImportError(r, 'undatedDuplicate'));

  for (const { cells: c, rowIndex } of responses) {
    const identity = parseStudentIdentity(
      [c[cols.firstName], c[cols.lastName], c[cols.className], c[cols.grade]],
      rowIndex,
      errors,
    );
    if (!identity) continue;
    const priorities = parsePriorities(
      cols.priorities.map((i) => c[i]),
      rowIndex,
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
    if (!priorities) continue;
    warnGradeMismatches(priorities, identity.grade, projects, rowIndex, errors);
    students.push({ ...identity, priorities });
  }

  return { students, errors, missingColumns: [], warnings: cols.warnings, duplicatesRemoved };
}
