import type { Student } from '@/types';
import { parseInteger } from '@/lib/validation';

export type StudentImportErrorCode =
  | 'firstNameMissing'
  | 'lastNameMissing'
  | 'classMissing'
  | 'invalidGrade'
  | 'ambiguousProject'
  | 'unknownProject'
  | 'duplicateProject'
  | 'deletedProject'
  | 'groupPrioritiesMismatch';
export type ParseError = {
  rowIndex: number;
  code: StudentImportErrorCode;
  severity: 'error' | 'warning';
  values?: Record<string, string | number>;
};
export function studentImportError(
  rowIndex: number,
  code: StudentImportErrorCode,
  values?: ParseError['values'],
): ParseError {
  return {
    rowIndex,
    code,
    values,
    severity: code === 'groupPrioritiesMismatch' ? 'warning' : 'error',
  };
}

export function parseStudentIdentity(
  cells: unknown[],
  rowIndex: number,
  errors: ParseError[],
): Pick<Student, 'firstName' | 'lastName' | 'className' | 'grade'> | null {
  const [firstName, lastName, className] = cells.slice(0, 3).map((c) => String(c ?? '').trim());
  const grade = parseInteger(cells[3]);
  const invalid = (code: StudentImportErrorCode): null => {
    errors.push(
      studentImportError(
        rowIndex,
        code,
        code === 'invalidGrade' ? { value: String(cells[3] ?? '') } : undefined,
      ),
    );
    return null;
  };
  if (!firstName) return invalid('firstNameMissing');
  if (!lastName) return invalid('lastNameMissing');
  if (!className) return invalid('classMissing');
  if (grade === null || grade < 5 || grade > 13) return invalid('invalidGrade');
  return { firstName, lastName, className, grade };
}

export type ProjectResolution =
  | { ok: true; id: string }
  | {
      ok: false;
      reason: 'unknown' | 'ambiguous' | 'deleted';
      candidates?: string[];
    };

/** Reject the entire row on an invalid wish: dropping one would change its ranks. */
export function parsePriorities(
  cells: unknown[],
  rowIndex: number,
  errors: ParseError[],
  resolve: (name: string) => ProjectResolution,
): string[] | null {
  const priorities: string[] = [];
  let invalid = false;
  for (const [index, cell] of cells.entries()) {
    const name = String(cell ?? '').trim();
    if (!name || /^[-–—]+$/.test(name)) continue;
    const match = resolve(name);
    if (!match.ok) {
      const codes = {
        unknown: 'unknownProject',
        ambiguous: 'ambiguousProject',
        deleted: 'deletedProject',
      } as const;
      errors.push(
        studentImportError(rowIndex, codes[match.reason], {
          priority: index + 1,
          name,
          candidates: (match.candidates ?? []).join(', '),
        }),
      );
      invalid = true;
      continue;
    }
    if (priorities.includes(match.id)) {
      errors.push(studentImportError(rowIndex, 'duplicateProject', { priority: index + 1, name }));
      invalid = true;
      continue;
    }
    priorities.push(match.id);
  }
  return invalid ? null : priorities;
}
