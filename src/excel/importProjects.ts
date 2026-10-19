import { parseGrades, parseInteger } from '@/lib/validation';
export { parseGrades } from '@/lib/validation';
import { normalizeLabel } from '@/forms/normalizeLabel';
import { detectProjectColumns, type ProjectColumnRole } from './headerMatchProjects';
import type { Project } from '@/types';

export type ProjectImportErrorCode =
  'nameMissing' | 'duplicateName' | 'invalidGrades' | 'invalidMax' | 'invalidTarget';

export type ProjectParseError = {
  rowIndex: number;
  code: ProjectImportErrorCode;
  values?: Record<string, string | number>;
};
export type ProjectParseResult = {
  projects: Omit<Project, 'id'>[];
  errors: ProjectParseError[];
  missingColumns: ProjectColumnRole[];
};

function projectImportError(
  rowIndex: number,
  code: ProjectImportErrorCode,
  values?: Record<string, string | number>,
): ProjectParseError {
  return { rowIndex, code, values };
}

export function parseProjectRows(rows: unknown[][]): ProjectParseResult {
  if (rows.length === 0) {
    return {
      projects: [],
      errors: [],
      missingColumns: ['name', 'grades', 'maxCapacity', 'targetCapacity'],
    };
  }
  const headers = rows[0].map((h) => String(h ?? ''));
  const cols = detectProjectColumns(headers);
  const missingColumns = cols.missingRequired();
  if (missingColumns.length > 0) {
    return { projects: [], errors: [], missingColumns };
  }

  const projects: Omit<Project, 'id'>[] = [];
  const errors: ProjectParseError[] = [];

  const names = new Set<string>();
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((cell) => String(cell ?? '').trim() === '')) continue;
    const name = String(row[cols.name] ?? '').trim();
    if (!name) {
      errors.push(projectImportError(r, 'nameMissing'));
      continue;
    }

    if (names.has(normalizeLabel(name))) {
      errors.push(projectImportError(r, 'duplicateName', { name }));
      continue;
    }
    names.add(normalizeLabel(name));

    const description =
      cols.description !== -1 ? String(row[cols.description] ?? '').trim() || undefined : undefined;

    const gradesRaw = String(row[cols.grades] ?? '').trim();
    const grades = parseGrades(gradesRaw);
    if (grades.length === 0) {
      errors.push(projectImportError(r, 'invalidGrades', { value: gradesRaw }));
      continue;
    }

    const maxRaw = row[cols.maxCapacity];
    const maxCapacity = parseInteger(maxRaw);
    if (maxCapacity === null || maxCapacity <= 0) {
      errors.push(projectImportError(r, 'invalidMax', { value: String(maxRaw ?? '') }));
      continue;
    }

    const targetRaw = row[cols.targetCapacity];
    const targetCapacity = parseInteger(targetRaw);
    if (targetCapacity === null || targetCapacity < 0 || targetCapacity > maxCapacity) {
      errors.push(
        projectImportError(r, 'invalidTarget', {
          value: String(targetRaw ?? ''),
          max: maxCapacity,
        }),
      );
      continue;
    }

    projects.push({ name, description, grades, maxCapacity, targetCapacity });
  }

  return { projects, errors, missingColumns: [] };
}
