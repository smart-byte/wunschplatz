import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import i18n from '@/i18n';
import { CountingSwitch } from '@/components/legal/CountingSwitch';

beforeAll(async () => {
  await i18n.changeLanguage('de');
});

beforeEach(() => {
  localStorage.clear();
});

const toggle = () => screen.getByRole('checkbox', { name: 'Besuche aus diesem Browser zählen' });

describe('CountingSwitch', () => {
  it('turns visit counting off and back on for this browser', () => {
    render(<CountingSwitch />);
    expect(toggle().getAttribute('aria-checked')).toBe('true');

    fireEvent.click(toggle());
    expect(localStorage.getItem('umami.disabled')).toBe('1');
    expect(toggle().getAttribute('aria-checked')).toBe('false');

    fireEvent.click(toggle());
    expect(localStorage.getItem('umami.disabled')).toBeNull();
  });

  it('shows counting as off when this browser opted out before', () => {
    localStorage.setItem('umami.disabled', '1');
    render(<CountingSwitch />);
    expect(toggle().getAttribute('aria-checked')).toBe('false');
  });
});
