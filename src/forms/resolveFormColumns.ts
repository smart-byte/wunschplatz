import { detectColumns, type ColumnRole } from '@/excel/headerMatch';
import type { FormBlueprint } from '@/types';

type IdentityRole = 'firstName' | 'lastName' | 'className' | 'grade';

export type FormColumns = {
  firstName: number;
  lastName: number;
  className: number;
  grade: number;
  priorities: number[];
  warnings: Array<{ code: 'heuristicColumn'; values: { expected: string; actual: string } }>;
  missingRequired: ColumnRole[];
};

function findExact(headers: string[], title: string): number {
  const t = title.trim().toLocaleLowerCase('de');
  return headers.findIndex((h) => h.trim().toLocaleLowerCase('de') === t);
}

export function resolveFormColumns(headers: string[], blueprint: FormBlueprint): FormColumns {
  const fuzzy = detectColumns(headers);
  const warnings: FormColumns['warnings'] = [];

  const titleByRole = {} as Record<IdentityRole, string>;
  for (const q of blueprint.identity) {
    if (
      q.key === 'firstName' ||
      q.key === 'lastName' ||
      q.key === 'className' ||
      q.key === 'grade'
    ) {
      titleByRole[q.key] = q.title;
    }
  }

  const resolveIdentity = (role: IdentityRole): number => {
    const exact = findExact(headers, titleByRole[role]);
    if (exact !== -1) return exact;
    const fb = fuzzy[role];
    // MS Forms exports hold the respondent's account name in "Name", never the last name.
    if (fb !== -1 && !(role === 'lastName' && /^name$/i.test(headers[fb].trim()))) {
      warnings.push({
        code: 'heuristicColumn',
        values: { expected: titleByRole[role], actual: headers[fb] },
      });
      return fb;
    }
    return -1;
  };

  const firstName = resolveIdentity('firstName');
  const lastName = resolveIdentity('lastName');
  const className = resolveIdentity('className');
  const grade = resolveIdentity('grade');

  const priorities = blueprint.priorities.map((q, i) => {
    const exact = findExact(headers, q.title);
    if (exact !== -1) return exact;
    const fb = fuzzy.priorities[i];
    if (fb !== -1) {
      warnings.push({
        code: 'heuristicColumn',
        values: { expected: q.title, actual: headers[fb] },
      });
      return fb;
    }
    return -1;
  });

  const missingRequired: ColumnRole[] = [];
  if (firstName === -1) missingRequired.push('firstName');
  if (lastName === -1) missingRequired.push('lastName');
  if (className === -1) missingRequired.push('className');
  if (grade === -1) missingRequired.push('grade');
  if (priorities.some((p) => p === -1)) missingRequired.push('priorities');

  return { firstName, lastName, className, grade, priorities, warnings, missingRequired };
}
