export function parseInteger(value: unknown): number | null {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+$/.test(value.trim())))
    return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

export function parseGrades(raw: string): number[] {
  const cleaned = raw
    .trim()
    .replace(/^\[(.*)\]$/, '$1')
    .replace(/^Kl(?:\.|asse)?\s*/i, '')
    .trim();
  const range = cleaned.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
  const valid = (n: number | null): n is number => n !== null && n >= 5 && n <= 13;
  if (range) {
    const from = parseInteger(range[1]);
    const to = parseInteger(range[2]);
    if (!valid(from) || !valid(to) || from > to) return [];
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
  }
  const grades = cleaned.split(/[,;\s]+/).map(parseInteger);
  if (!grades.length || !grades.every(valid)) return [];
  return [...new Set(grades)].sort((a, b) => a - b);
}
