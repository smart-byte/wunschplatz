export type ProjectColumnRole = 'name' | 'description' | 'grades' | 'maxCapacity' | 'targetCapacity';

export type ProjectColumnMap = {
  name: number;
  description: number;
  grades: number;
  maxCapacity: number;
  targetCapacity: number;
  missingRequired: () => ProjectColumnRole[];
};

const patterns: Record<ProjectColumnRole, RegExp[]> = {
  name: [/^name$/i, /^projekt(name)?$/i, /^project(\s*name)?$/i, /^titel$/i, /^title$/i, /^bezeichnung$/i],
  description: [/^beschreibung$/i, /^description$/i, /^info$/i, /^details$/i, /^desc$/i],
  grades: [/^jahrgänge$/i, /^jahrgang$/i, /^jahrgangsstufen?$/i, /^grades?$/i, /^stufen?$/i],
  maxCapacity: [
    /^max$/i, /^maximum$/i, /^obergrenze$/i,
    /^max[-\s.]?(kapazität|capacity|kap)$/i,
    /^kapazität[-\s.]?max$/i,
  ],
  targetCapacity: [
    /^soll$/i, /^ziel$/i, /^target$/i,
    /^soll[-\s.]?(kapazität|capacity|kap)$/i,
    /^ziel[-\s.]?(kapazität|capacity)$/i,
    /^target[-\s.]?capacity$/i,
  ],
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

export function detectProjectColumns(headers: string[]): ProjectColumnMap {
  const name = findColumn(headers, patterns.name);
  const description = findColumn(headers, patterns.description);
  const grades = findColumn(headers, patterns.grades);
  const maxCapacity = findColumn(headers, patterns.maxCapacity);
  const targetCapacity = findColumn(headers, patterns.targetCapacity);
  return {
    name,
    description,
    grades,
    maxCapacity,
    targetCapacity,
    missingRequired() {
      const missing: ProjectColumnRole[] = [];
      if (name === -1) missing.push('name');
      if (grades === -1) missing.push('grades');
      if (maxCapacity === -1) missing.push('maxCapacity');
      if (targetCapacity === -1) missing.push('targetCapacity');
      return missing;
    },
  };
}
