export type ColumnRole = 'firstName' | 'lastName' | 'className' | 'grade' | 'priorities';

export type ColumnMap = {
  firstName: number;
  lastName: number;
  className: number;
  grade: number;
  priorities: [number, number, number, number, number];
  missingRequired: () => ColumnRole[];
};

const patterns: Record<Exclude<ColumnRole, 'priorities'>, RegExp[]> = {
  firstName: [/^vorname$/i, /^first\s*name$/i, /^firstname$/i],
  lastName: [/^nachname$/i, /^last\s*name$/i, /^lastname$/i, /^name$/i],
  className: [/^klasse$/i, /^class$/i],
  grade: [/^jahrgang$/i, /^grade$/i, /^stufe$/i, /^jahrgangsstufe$/i],
};

function normalize(s: string): string {
  return s.trim();
}

function findColumn(headers: string[], regexes: RegExp[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = normalize(headers[i]);
    if (regexes.some((r) => r.test(h))) return i;
  }
  return -1;
}

function findPriority(headers: string[], k: number): number {
  const regs = [
    new RegExp(`^prio\\s*${k}$`, 'i'),
    new RegExp(`^priority\\s*${k}$`, 'i'),
    new RegExp(`^prioritat\\s*${k}$`, 'i'),
    new RegExp(`^priorität\\s*${k}$`, 'i'),
  ];
  return findColumn(headers, regs);
}

export function detectColumns(headers: string[]): ColumnMap {
  const firstName = findColumn(headers, patterns.firstName);
  const lastName = findColumn(headers, patterns.lastName);
  const className = findColumn(headers, patterns.className);
  const grade = findColumn(headers, patterns.grade);
  const priorities: [number, number, number, number, number] = [
    findPriority(headers, 1),
    findPriority(headers, 2),
    findPriority(headers, 3),
    findPriority(headers, 4),
    findPriority(headers, 5),
  ];
  return {
    firstName,
    lastName,
    className,
    grade,
    priorities,
    missingRequired() {
      const missing: ColumnRole[] = [];
      if (firstName === -1) missing.push('firstName');
      if (lastName === -1) missing.push('lastName');
      if (className === -1) missing.push('className');
      if (grade === -1) missing.push('grade');
      if (priorities.every((p) => p === -1)) missing.push('priorities');
      return missing;
    },
  };
}
