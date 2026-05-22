import { detectProjectColumns, type ProjectColumnRole } from './headerMatchProjects';
import type { Project } from '@/types';

export type ProjectParseError = { rowIndex: number; message: string };
export type ProjectParseResult = {
  projects: Omit<Project, 'id'>[];
  errors: ProjectParseError[];
  missingColumns: ProjectColumnRole[];
};

/**
 * Parse a grades cell. Supports: "5-7", "5,6,7", "5;6;7", "5 6 7",
 * "[5,6,7]", "Kl. 5". Returns deduped sorted numbers.
 */
export function parseGrades(raw: string): number[] {
  const cleaned = raw.replace(/[\[\]]/g, '').replace(/Kl\.?\s*/gi, '').trim();
  if (!cleaned || /^[-–—]+$/.test(cleaned)) return [];
  // Range "5-7" or "5–7" or "5—7"
  const rangeMatch = cleaned.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
  if (rangeMatch) {
    const from = parseInt(rangeMatch[1], 10);
    const to = parseInt(rangeMatch[2], 10);
    if (!isNaN(from) && !isNaN(to) && from <= to) {
      const out: number[] = [];
      for (let g = from; g <= to; g++) out.push(g);
      return out;
    }
  }
  // Comma/semicolon/space-separated
  const parts = cleaned
    .split(/[,;\s]+/)
    .map((p) => parseInt(p.trim(), 10))
    .filter((n) => !isNaN(n));
  const dedup = [...new Set(parts)].sort((a, b) => a - b);
  return dedup;
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

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const name = String(row[cols.name] ?? '').trim();
    if (!name) {
      errors.push({ rowIndex: r, message: 'Name fehlt' });
      continue;
    }

    const description = cols.description !== -1
      ? (String(row[cols.description] ?? '').trim() || undefined)
      : undefined;

    const gradesRaw = String(row[cols.grades] ?? '').trim();
    const parsedGrades = parseGrades(gradesRaw);
    const grades = parsedGrades.filter((g) => g >= 5 && g <= 13);
    if (grades.length === 0) {
      errors.push({
        rowIndex: r,
        message: `Jahrgänge ungültig oder leer ("${gradesRaw}") — erwartet z.B. "5-7" oder "5,6,7"`,
      });
      continue;
    }
    if (grades.length !== parsedGrades.length) {
      errors.push({
        rowIndex: r,
        message: `Einige Jahrgänge außerhalb 5-13 wurden ignoriert (importiert: ${grades.join(', ')})`,
      });
    }

    const maxRaw = row[cols.maxCapacity];
    const maxCapacity = typeof maxRaw === 'number'
      ? maxRaw
      : parseInt(String(maxRaw ?? ''), 10);
    if (isNaN(maxCapacity) || maxCapacity <= 0) {
      errors.push({ rowIndex: r, message: `Max-Kapazität ungültig (${maxRaw})` });
      continue;
    }

    const targetRaw = row[cols.targetCapacity];
    const targetCapacity = typeof targetRaw === 'number'
      ? targetRaw
      : parseInt(String(targetRaw ?? ''), 10);
    if (isNaN(targetCapacity) || targetCapacity < 0 || targetCapacity > maxCapacity) {
      errors.push({
        rowIndex: r,
        message: `Soll-Kapazität ungültig (${targetRaw}) — muss zwischen 0 und ${maxCapacity} liegen`,
      });
      continue;
    }

    projects.push({ name, description, grades, maxCapacity, targetCapacity });
  }

  return { projects, errors, missingColumns: [] };
}
