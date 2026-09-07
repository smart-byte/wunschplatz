import { describe, it, expect } from 'vitest';
import { normalizeLabel } from '@/forms/normalizeLabel';

describe('normalizeLabel', () => {
  it('trims, collapses inner whitespace, lowercases (de)', () => {
    expect(normalizeLabel('  Yoga ')).toBe('yoga');
    expect(normalizeLabel('YOGA')).toBe('yoga');
    expect(normalizeLabel('Comic   Buch')).toBe('comic buch');
    expect(normalizeLabel('Fußball')).toBe('fußball');
  });
});
