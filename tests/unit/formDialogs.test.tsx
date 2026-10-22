import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import ProjectsPage from '@/pages/ProjectsPage';
import { useProjectsStore } from '@/store/useProjectsStore';
import type { Project } from '@/types';
import { ProjectFormDialog } from '@/components/projects/ProjectFormDialog';
import { StudentFormDialog } from '@/components/students/StudentFormDialog';

beforeAll(async () => {
  await i18n.changeLanguage('de');
});
afterEach(() => vi.restoreAllMocks());

const pressEscape = () =>
  fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });

function openProjectForm() {
  render(<ProjectFormDialog trigger={<button>Neu</button>} onSave={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Neu' }));
}

describe('form dialogs', () => {
  it('close on Escape without asking while nothing was entered', () => {
    const confirm = vi.spyOn(window, 'confirm');
    openProjectForm();
    pressEscape();
    expect(confirm).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('ask before Escape discards a new project', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    openProjectForm();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Schach' } });
    pressEscape();
    expect(confirm).toHaveBeenCalledOnce();
    expect(screen.getByRole('dialog')).toBeTruthy();
    confirm.mockReturnValue(true);
    pressEscape();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('ask before Escape discards a new student', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<StudentFormDialog open onOpenChange={vi.fn()} onSave={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Vorname'), { target: { value: 'Anna' } });
    pressEscape();
    expect(confirm).toHaveBeenCalledOnce();
  });

  describe('while another tab changes the projects', () => {
    const project = (id: string, name: string): Project => ({
      id,
      name,
      grades: [7],
      maxCapacity: 10,
      targetCapacity: 8,
    });
    const renderPage = (projects: Project[]) => {
      useProjectsStore.setState({ projects });
      render(
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>,
      );
    };

    it('keep a new project draft when the first project arrives', () => {
      renderPage([]);
      fireEvent.click(screen.getByRole('button', { name: 'Neues Projekt' }));
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Keramik' } });
      act(() => useProjectsStore.setState({ projects: [project('remote', 'Theater')] }));
      expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Keramik');
    });

    it('keep editing a deleted project open and report the deletion on save', () => {
      renderPage([project('p1', 'Keramik'), project('p2', 'Theater')]);
      fireEvent.click(screen.getByRole('button', { name: 'Keramik bearbeiten' }));
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Töpfern' } });
      act(() => useProjectsStore.setState({ projects: [project('p2', 'Theater')] }));
      fireEvent.click(screen.getByRole('button', { name: 'Speichern' }));
      expect(screen.getByRole('alert').textContent).toBe(
        'Dieser Eintrag wurde in einem anderen Tab gelöscht.',
      );
      expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Töpfern');
    });
  });
});
