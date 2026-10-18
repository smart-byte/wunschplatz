import { normalizeLabel } from './normalizeLabel';
import { parseTimestamp } from './parseTimestamp';

// Prefer completion time even when Microsoft Forms puts start time first.
const TIMESTAMP_HEADERS = [
  'timestamp',
  'zeitstempel',
  'completion time',
  'abschlusszeit',
  'start time',
  'startzeit',
];

export type Response = { cells: unknown[]; rowIndex: number };

export function findTimestampColumn(headers: string[]): number {
  const normalized = headers.map((h) => h.trim().toLocaleLowerCase('de'));
  return TIMESTAMP_HEADERS.map((name) => normalized.indexOf(name)).find((i) => i >= 0) ?? -1;
}

/** Non-empty rows below the header, with their sheet row index. */
export function responseRows(rows: unknown[][]): Response[] {
  const responses: Response[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => String(c ?? '').trim() === '')) continue;
    responses.push({ cells: row, rowIndex: r });
  }
  return responses;
}

/**
 * Keeps one response per student (same name, class and grade): the latest by timestamp, or
 * the last row when a timestamp is missing. The result stays in sheet order.
 */
export function keepLatestResponses(
  responses: Response[],
  identityColumns: number[],
  timestampColumn: number,
): { responses: Response[]; duplicatesRemoved: number } {
  type Entry = Response & { ts: number | null };
  const keyOf = (cells: unknown[]) =>
    identityColumns.map((i) => normalizeLabel(String(cells[i] ?? ''))).join('\u0000');
  const kept = new Map<string, Entry>();
  let duplicatesRemoved = 0;
  for (const response of responses) {
    const entry: Entry = {
      ...response,
      ts: timestampColumn === -1 ? null : parseTimestamp(response.cells[timestampColumn]),
    };
    const key = keyOf(entry.cells);
    const prev = kept.get(key);
    if (!prev) {
      kept.set(key, entry);
      continue;
    }
    duplicatesRemoved++;
    kept.set(key, pickLatest(prev, entry));
  }
  return {
    responses: [...kept.values()]
      .sort((a, b) => a.rowIndex - b.rowIndex)
      .map(({ cells, rowIndex }) => ({ cells, rowIndex })),
    duplicatesRemoved,
  };
}

function pickLatest<T extends { ts: number | null }>(a: T, b: T): T {
  if (a.ts === null) return b;
  if (b.ts === null) return a;
  return b.ts >= a.ts ? b : a;
}
