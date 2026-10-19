export function parseTimestamp(cell: unknown): number | null {
  if (cell instanceof Date) {
    const t = cell.getTime();
    return isNaN(t) ? null : t;
  }
  if (typeof cell === 'number') {
    if (!Number.isFinite(cell)) return null;
    // SheetJS yields Excel day serials; larger numbers are JavaScript timestamps.
    if (cell > 0 && cell < 2_958_466) {
      return Math.round((cell - 25_569) * 86_400_000);
    }
    return cell;
  }

  const s = String(cell ?? '').trim();
  if (!s) return null;

  // Date.parse does not reliably recognize German day/month order.
  const de = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (de) {
    const [, d, mo, y, h = '0', mi = '0', se = '0'] = de;
    const dd = Number(d),
      mm = Number(mo),
      yy = Number(y),
      hh = Number(h),
      mn = Number(mi),
      ss = Number(se);
    const dt = new Date(yy, mm - 1, dd, hh, mn, ss);
    // Reject rollover (e.g. 31.02. → March, 25:00, month 13): components must round-trip.
    if (
      dt.getFullYear() !== yy ||
      dt.getMonth() !== mm - 1 ||
      dt.getDate() !== dd ||
      dt.getHours() !== hh ||
      dt.getMinutes() !== mn ||
      dt.getSeconds() !== ss
    )
      return null;
    return dt.getTime();
  }

  // ISO 8601 (guard so we don't accept ambiguous locale strings via Date.parse).
  if (/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2})?/.test(s)) {
    const t = Date.parse(s);
    return isNaN(t) ? null : t;
  }

  return null;
}
