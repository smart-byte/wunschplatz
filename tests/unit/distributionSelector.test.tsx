import { beforeAll, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { DistributionSelector } from '@/components/distribution/DistributionSelector';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { defaultSolverConfig } from '@/types';

beforeAll(async () => {
  await i18n.changeLanguage('de');
});

function openRename() {
  useAssignmentsStore.setState({
    distributions: [
      {
        id: 'd1',
        name: 'Lauf 1',
        createdAt: 0,
        updatedAt: 0,
        assignments: [],
        run: {
          kind: 'solver',
          timestamp: 0,
          config: defaultSolverConfig,
          score: 0,
          stats: {
            totalStudents: 0,
            assignedByPriority: [0, 0, 0, 0, 0],
            notInTop5: 0,
            unassigned: 0,
          },
        },
      },
    ],
    activeId: 'd1',
  });
  render(
    <MemoryRouter>
      <DistributionSelector />
    </MemoryRouter>,
  );
  fireEvent.keyDown(screen.getByRole('button', { name: 'Aktionen' }), { key: 'Enter' });
  fireEvent.click(screen.getByRole('menuitem', { name: 'Umbenennen' }));
  return screen.getByLabelText('Name');
}

const submit = (input: HTMLElement) => fireEvent.submit(input.closest('form')!);

describe('DistributionSelector rename', () => {
  it('saves the new name on Enter', () => {
    const input = openRename();
    fireEvent.change(input, { target: { value: 'Herbst' } });
    submit(input);
    expect(useAssignmentsStore.getState().distributions[0].name).toBe('Herbst');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('asks for a name instead of reporting an empty rename as done', () => {
    const input = openRename();
    fireEvent.change(input, { target: { value: '  ' } });
    submit(input);
    expect(screen.getByRole('alert').textContent).toMatch(/Namen/);
    expect(useAssignmentsStore.getState().distributions[0].name).toBe('Lauf 1');
  });
});
