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
  it('reads Excel serial dates as local wall-clock time, like German text dates', () => {
    expect(parseTimestamp(46023)).toBe(new Date(2026, 0, 1).getTime());
    expect(parseTimestamp(46023.5)).toBe(new Date(2026, 0, 1, 12).getTime());
    // 20.10.2026 09:30 as a serial is older than the same day's 10:30 as text.
    expect(parseTimestamp(46315 + 9.5 / 24)!).toBeLessThan(parseTimestamp('20.10.2026 10:30:00')!);
  });
  it('parses US Microsoft Forms timestamps with AM/PM', () => {
    expect(parseTimestamp('10/20/2026 9:30:00 AM')).toBe(new Date(2026, 9, 20, 9, 30).getTime());
    expect(parseTimestamp('10/20/2026 12:05 PM')).toBe(new Date(2026, 9, 20, 12, 5).getTime());
    expect(parseTimestamp('10/20/2026 12:05 AM')).toBe(new Date(2026, 9, 20, 0, 5).getTime());
    expect(parseTimestamp('10/11/2026 9:30')).toBeNull();
    expect(parseTimestamp('20/10/2026 9:30 AM')).toBeNull();
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
