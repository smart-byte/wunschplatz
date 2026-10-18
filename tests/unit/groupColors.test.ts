import { describe, expect, it } from 'vitest';
import { resolveColor } from '@/lib/groups';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('custom group colours', () => {
  it.each(['#fde047', '#ff0000', '#22c55e', '#777777', '#1e3a8a', '#e11d48', '#00bcd4'])(
    'pick a readable text colour on %s',
    (hex) => {
      const color = resolveColor(hex);
      if (color.kind !== 'custom') throw new Error('expected a custom colour');
      expect(contrast(color.textHex, color.hex)).toBeGreaterThanOrEqual(4.5);
    },
  );
});
