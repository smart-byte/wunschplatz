import { parseGrades, parseInteger } from '@/lib/validation';
import { normalizeLabel } from '@/forms/normalizeLabel';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Project } from '@/types';
import { mergeChanges } from '@/store/mergeChanges';

type Props = {
  trigger: React.ReactNode;
  initial?: Project;
  onSave: (data: Omit<Project, 'id'>) => void;
};

export function ProjectFormDialog({ trigger, initial, onSave }: Props) {
  const { t } = useTranslation('app');
  const id = useId();
  const projects = useProjectsStore((s) => s.projects);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [gradesText, setGradesText] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('20');
  const [targetCapacity, setTargetCapacity] = useState('15');
  const [error, setError] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<Project | undefined>();

  function changeOpen(next: boolean) {
    if (next) {
      setBaseline(initial);
      setName(initial?.name ?? '');
      setDescription(initial?.description ?? '');
      setGradesText(initial?.grades.join(', ') ?? '');
      setMaxCapacity(String(initial?.maxCapacity ?? 20));
      setTargetCapacity(String(initial?.targetCapacity ?? 15));
      setError(null);
    }
    setOpen(next);
  }

  function handleSave() {
    const grades = parseGrades(gradesText);
    const max = parseInteger(maxCapacity);
    const target = parseInteger(targetCapacity);
    if (!name.trim()) {
      setError(t('projects.form.nameRequired'));
      return;
    }
    if (grades.length === 0) {
      setError(t('projects.form.gradesRequired'));
      return;
    }
    if (max === null || max <= 0) {
      setError(t('projects.form.maxPositive'));
      return;
    }
    if (target === null || target < 0 || target > max) {
      setError(t('projects.form.targetRange'));
      return;
    }
    const draft = {
      name: name.trim(),
      description: description.trim() || undefined,
      grades,
      maxCapacity: max,
      targetCapacity: target,
    };
    let data: Omit<Project, 'id'> = draft;
    if (baseline) {
      const current = useProjectsStore.getState().projects.find((p) => p.id === baseline.id);
      if (!current) {
        setError(t('common.itemDeleted'));
        return;
      }
      const merged = mergeChanges(baseline, { ...baseline, ...draft }, current);
      if (merged.conflict || merged.value.targetCapacity > merged.value.maxCapacity) {
        setBaseline(current);
        setName(merged.value.name);
        setDescription(merged.value.description ?? '');
        setGradesText(merged.value.grades.join(', '));
        setMaxCapacity(String(merged.value.maxCapacity));
        setTargetCapacity(String(merged.value.targetCapacity));
        setError(t('common.editConflict'));
        return;
      }
      data = merged.value;
    }
    if (
      projects.some(
        (p) => p.id !== baseline?.id && normalizeLabel(p.name) === normalizeLabel(data.name),
      )
    ) {
      setError(t('projects.form.duplicateName'));
      return;
    }
    onSave(data);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {initial ? t('projects.form.editTitle') : t('projects.newProject')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor={id + 'name'}>{t('projects.form.name')}</Label>
              <Input id={id + 'name'} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={id + 'desc'}>{t('projects.form.description')}</Label>
              <Input
                id={id + 'desc'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={id + 'grades'}>{t('projects.form.grades')}</Label>
              <Input
                id={id + 'grades'}
                value={gradesText}
                onChange={(e) => setGradesText(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor={id + 'max'}>{t('projects.form.maxCapacity')}</Label>
                <Input
                  id={id + 'max'}
                  type="number"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={id + 'target'}>{t('projects.form.targetCapacity')}</Label>
                <Input
                  id={id + 'target'}
                  type="number"
                  value={targetCapacity}
                  onChange={(e) => setTargetCapacity(e.target.value)}
                />
              </div>
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('common.save')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
