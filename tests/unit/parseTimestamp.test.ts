import { describe, it, expect } from 'vitest';
import { parseTimestamp } from '@/forms/parseTimestamp';

describe('parseTimestamp', () => {
  it('parses ISO 8601 strings', () => {
    expect(parseTimestamp('2026-06-02T14:30:00Z')).toBe(Date.parse('2026-06-02T14:30:00Z'));
  });
  it('parses German DD.MM.YYYY HH:mm[:ss]', () => {
    expect(parseTimestamp('01.06.2026 14:30')).toBe(new Date(2026, 5, 1, 14, 30, 0).getTime());
    expect(parseTimestamp('01.06.2026 14:30:45')).toBe(new Date(2026, 5, 1, 14, 30, 45).getTime());
  });
  it('parses German date-only DD.MM.YYYY', () => {
    expect(parseTimestamp('01.06.2026')).toBe(new Date(2026, 5, 1, 0, 0, 0).getTime());
  });
  it('uses Date instances and numbers directly', () => {
    const d = new Date(2026, 0, 1);
    expect(parseTimestamp(d)).toBe(d.getTime());
    expect(parseTimestamp(1717000000000)).toBe(1717000000000);
  });
  it('converts Excel serial date values from XLSX workbooks', () => {
    expect(parseTimestamp(46023)).toBe(Date.UTC(2026, 0, 1));
    expect(parseTimestamp(46023.5)).toBe(Date.UTC(2026, 0, 1, 12));
  });
  it('returns null for empty/unparseable', () => {
    expect(parseTimestamp('')).toBeNull();
    expect(parseTimestamp('  ')).toBeNull();
    expect(parseTimestamp('gestern')).toBeNull();
    expect(parseTimestamp(null)).toBeNull();
  });
  it('returns null for impossible German dates/times (no silent rollover)', () => {
    expect(parseTimestamp('31.02.2026')).toBeNull();
    expect(parseTimestamp('01.13.2026')).toBeNull();
    expect(parseTimestamp('01.06.2026 25:00')).toBeNull();
  });
});
