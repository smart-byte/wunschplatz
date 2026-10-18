import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import i18n from '@/i18n';
import { RoundsGate } from '@/components/RoundsGate';
import { useRoundsStore } from '@/store/useRoundsStore';
import { useSessionStore } from '@/store/session';

vi.mock('@/store/bootstrapRounds', () => ({ ensureRoundsReady: () => new Promise(() => {}) }));

beforeAll(async () => {
  await i18n.changeLanguage('de');
});

const gate = () =>
  render(
    <RoundsGate nav={<nav />}>
      <p>Projektliste</p>
    </RoundsGate>,
  );

describe('RoundsGate', () => {
  it('keeps loaded data readable after a storage error, so it can still be exported', () => {
    useRoundsStore.setState({
      rounds: [{ id: 'r1', name: 'Wunschrunde 1', createdAt: 'x', status: 'active' }],
      activeRoundId: 'r1',
    });
    useSessionStore.setState({ phase: 'error', error: 'storage' });
    gate();
    expect(screen.getByText('Projektliste')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toMatch(/Excel-Export/);
  });

  it('shows only the error when no data could be loaded', () => {
    useRoundsStore.setState({ rounds: [], activeRoundId: null });
    useSessionStore.setState({ phase: 'error', error: 'storage' });
    gate();
    expect(screen.queryByText('Projektliste')).toBeNull();
    expect(
      screen.getByRole('heading', { name: 'Speichern oder Laden fehlgeschlagen' }),
    ).toBeTruthy();
  });
});
