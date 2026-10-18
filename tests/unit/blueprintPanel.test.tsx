import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import i18n from '@/i18n';
import { BlueprintPanel } from '@/components/rounds/BlueprintPanel';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useRoundsStore } from '@/store/useRoundsStore';

beforeAll(async () => {
  await i18n.changeLanguage('en');
});
afterAll(async () => {
  await i18n.changeLanguage('de');
});

describe('BlueprintPanel', () => {
  it('creates the German form template and prompt even in the English UI', () => {
    useProjectsStore.setState({
      projects: [
        { id: 'p1', name: 'Schach', grades: [7], maxCapacity: 10, targetCapacity: 8 },
        { id: 'p2', name: 'Theater', grades: [7], maxCapacity: 10, targetCapacity: 8 },
      ],
    });
    useRoundsStore.setState({
      rounds: [{ id: 'r1', name: 'Sommer', createdAt: 'x', status: 'active' }],
      activeRoundId: 'r1',
    });
    render(<BlueprintPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Create template' }));
    const blueprint = useRoundsStore.getState().rounds[0].blueprint;
    expect(blueprint?.identity.map((q) => q.title)).toEqual([
      'Vorname',
      'Nachname',
      'Klasse',
      'Jahrgang',
    ]);
    expect(blueprint?.priorities.map((q) => q.title)).toEqual(['1. Wahl', '2. Wahl']);
    expect(screen.getByText(/^Erstelle ein Google-Formular/)).toBeTruthy();
  });
});
