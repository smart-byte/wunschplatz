export function normalizeLabel(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLocaleLowerCase('de');
}
