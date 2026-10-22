export function parseTimestamp(cell: unknown): number | null {
  if (cell instanceof Date) {
    const t = cell.getTime();
    return isNaN(t) ? null : t;
  }
  if (typeof cell === 'number') {
    if (!Number.isFinite(cell)) return null;
    // SheetJS yields Excel day serials; larger numbers are JavaScript timestamps.
    if (cell > 0 && cell < 2_958_466) {
      // Serials are wall-clock time without a zone; read them as local time like text dates,
      // so a sheet mixing both orders its submissions correctly.
      const d = new Date(Math.round((cell - 25_569) * 86_400_000));
      return new Date(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate(),
        d.getUTCHours(),
        d.getUTCMinutes(),
        d.getUTCSeconds(),
      ).getTime();
    }
    return cell;
  }

  const s = String(cell ?? '').trim();
  if (!s) return null;

  // Date.parse does not reliably recognize German day/month order.
  const de = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (de) {
    const [, d, mo, y, h = '0', mi = '0', se = '0'] = de;
    return localTime(+y, +mo, +d, +h, +mi, +se);
  }

  // US Microsoft Forms exports: M/D/YYYY h:mm[:ss] AM/PM. Without AM/PM the day/month order
  // is ambiguous, so such dates stay unparsed.
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),? (\d{1,2}):(\d{2})(?::(\d{2}))? ?([AP]M)$/i);
  if (us) {
    const [, mo, d, y, h, mi, se = '0', half] = us;
    if (+h < 1 || +h > 12) return null;
    return localTime(+y, +mo, +d, (+h % 12) + (/pm/i.test(half) ? 12 : 0), +mi, +se);
  }

  // ISO 8601 (guard so we don't accept ambiguous locale strings via Date.parse).
  if (/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2})?/.test(s)) {
    const t = Date.parse(s);
    return isNaN(t) ? null : t;
  }

  return null;
}

function localTime(y: number, mo: number, d: number, h: number, mi: number, s: number) {
  const dt = new Date(y, mo - 1, d, h, mi, s);
  // Reject rollover (e.g. 31.02. → March, 25:00, month 13): components must round-trip.
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== mo - 1 ||
    dt.getDate() !== d ||
    dt.getHours() !== h ||
    dt.getMinutes() !== mi ||
    dt.getSeconds() !== s
  )
    return null;
  return dt.getTime();
}
