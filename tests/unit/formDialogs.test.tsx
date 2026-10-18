import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import i18n from '@/i18n';
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
});
