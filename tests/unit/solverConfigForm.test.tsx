import { beforeAll, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import i18n from '@/i18n';
import { SolverConfigForm } from '@/components/optimize/SolverConfigForm';
import { useSolverConfigStore } from '@/store/useSolverConfigStore';

beforeAll(async () => {
  await i18n.changeLanguage('de');
  // The weight sliders measure themselves; jsdom has no ResizeObserver.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

it.each(['1e3', '12.5', '-100', '9007199254740993'])(
  'keeps the saved penalty and marks the field when "%s" is entered',
  (value) => {
    useSolverConfigStore.getState().reset();
    const saved = useSolverConfigStore.getState().config.unmatchedPenalty;
    render(<SolverConfigForm />);
    const input = screen.getByLabelText('Ohne Projekt');
    fireEvent.change(input, { target: { value } });
    expect(useSolverConfigStore.getState().config.unmatchedPenalty).toBe(saved);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    fireEvent.change(input, { target: { value: '750' } });
    expect(useSolverConfigStore.getState().config.unmatchedPenalty).toBe(750);
    expect(input.getAttribute('aria-invalid')).toBe('false');
  },
);
