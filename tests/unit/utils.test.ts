import { describe, expect, it } from 'vitest';
import { nextDefaultName } from '@/lib/utils';

describe('nextDefaultName', () => {
  const name = (n: number) => `Wunschrunde ${n}`;

  it('counts up from the number of existing items', () => {
    expect(nextDefaultName(['Wunschrunde 1', 'Wunschrunde 2'], name)).toBe('Wunschrunde 3');
  });

  it('skips a name that is still in use after a delete', () => {
    expect(nextDefaultName(['Wunschrunde 1', 'Wunschrunde 3'], name)).toBe('Wunschrunde 4');
  });
});
