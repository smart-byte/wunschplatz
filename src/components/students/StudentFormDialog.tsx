import { parseInteger } from '@/lib/validation';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useStudentsStore } from '@/store/useStudentsStore';
import { getGroupMembers, getGroupColor } from '@/lib/groups';
import { Users } from 'lucide-react';
import type { Student } from '@/types';
import { mergeChanges, sameValue } from '@/store/mergeChanges';

type Props = {
  trigger?: React.ReactNode;
  initial?: Student;
  onSave: (data: Omit<Student, 'id'>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const NONE = '__none__';

function formFields(student?: Student) {
  return {
    firstName: student?.firstName ?? '',
    lastName: student?.lastName ?? '',
    className: student?.className ?? '',
    grade: String(student?.grade ?? 7),
    priorities: Array.from({ length: 5 }, (_, i) => student?.priorities[i] ?? null),
  };
}

export function StudentFormDialog({
  trigger,
  initial,
  onSave,
  open: externalOpen,
  onOpenChange,
}: Props) {
  const { t } = useTranslation('app');
  const id = useId();
  const projects = useProjectsStore((s) => s.projects);
  const allStudents = useStudentsStore((s) => s.students);
  const groupColors = useStudentsStore((s) => s.groupColors);
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = (v: boolean) => {
    if (isControlled) onOpenChange?.(v);
    else setInternalOpen(v);
  };
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [className, setClassName] = useState('');
  const [grade, setGrade] = useState('7');
  const [priorities, setPriorities] = useState<(string | null)[]>([null, null, null, null, null]);
  const [error, setError] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<Student | undefined>();
  const wasOpen = useRef(false);

  useLayoutEffect(() => {
    const opening = open && !wasOpen.current;
    wasOpen.current = open;
    if (!opening) return;
    const fields = formFields(initial);
    setBaseline(initial);
    setFirstName(fields.firstName);
    setLastName(fields.lastName);
    setClassName(fields.className);
    setGrade(fields.grade);
    setPriorities(fields.priorities);
    setError(null);
  }, [open, initial]);

  const dirty = !sameValue(formFields(baseline), {
    firstName,
    lastName,
    className,
    grade,
    priorities,
  });

  function setPriority(index: number, value: string) {
    const next = [...priorities];
    next[index] = value === NONE ? null : value;
    setPriorities(next);
  }

  function handleSave() {
    if (!firstName.trim()) {
      setError(t('students.form.firstNameRequired'));
      return;
    }
    if (!lastName.trim()) {
      setError(t('students.form.lastNameRequired'));
      return;
    }
    if (!className.trim()) {
      setError(t('students.form.classRequired'));
      return;
    }
    const parsedGrade = parseInteger(grade);
    if (parsedGrade === null || parsedGrade < 5 || parsedGrade > 13) {
      setError(t('students.form.gradeRange'));
      return;
    }

    const cleaned = priorities.filter((p): p is string => p !== null);
    if (cleaned.some((id) => !projects.some((p) => p.id === id))) {
      setError(t('students.form.projectRemoved'));
      return;
    }
    const unique = new Set(cleaned);
    if (unique.size !== cleaned.length) {
      setError(t('students.form.prioritiesUnique'));
      return;
    }
    const draft = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      className: className.trim(),
      grade: parsedGrade,
      priorities: cleaned,
    };
    if (baseline) {
      const current = useStudentsStore.getState().students.find((s) => s.id === baseline.id);
      if (!current) {
        setError(t('common.itemDeleted'));
        return;
      }
      const merged = mergeChanges(baseline, { ...baseline, ...draft }, current);
      if (merged.conflict) {
        setBaseline(current);
        setFirstName(merged.value.firstName);
        setLastName(merged.value.lastName);
        setClassName(merged.value.className);
        setGrade(String(merged.value.grade));
        setPriorities(Array.from({ length: 5 }, (_, i) => merged.value.priorities[i] ?? null));
        setError(t('common.editConflict'));
        return;
      }
      onSave(merged.value);
    } else {
      onSave(draft);
    }
    setOpen(false);
  }

  const siblings = initial?.groupId
    ? getGroupMembers(allStudents, initial.groupId).filter((m) => m.id !== initial.id)
    : [];
  const groupColor = initial?.groupId ? getGroupColor(initial.groupId, groupColors) : null;

  const compatProjects = projects.filter((p) => p.grades.includes(Number(grade)));
  const incompatProjects = projects.filter((p) => !p.grades.includes(Number(grade)));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className="max-w-2xl"
        confirmDismiss={dirty ? t('common.discardChanges') : undefined}
      >
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {initial ? t('students.form.editTitle') : t('students.newStudent')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            {initial?.groupId && groupColor && (
              <div
                className={
                  groupColor.kind === 'palette'
                    ? `flex items-start gap-2 rounded-md border p-3 ${groupColor.bgClass} ${groupColor.textClass}`
                    : 'flex items-start gap-2 rounded-md border p-3'
                }
                style={
                  groupColor.kind === 'custom'
                    ? { backgroundColor: groupColor.hex, color: groupColor.textHex }
                    : undefined
                }
              >
                <Users className="size-4 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">
                    {t('students.form.inGroup', {
                      label:
                        groupColor.kind === 'custom'
                          ? groupColor.label
                          : t(`students.colors.${groupColor.key}`),
                    })}
                  </p>
                  <p className="text-xs opacity-80">
                    {t('students.form.prioNote', {
                      names:
                        siblings.map((s) => `${s.firstName} ${s.lastName}`).join(', ') ||
                        t('students.form.onlyThisStudent'),
                    })}
                  </p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor={id + 'firstName'}>{t('students.form.firstName')}</Label>
                <Input
                  id={id + 'firstName'}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={id + 'lastName'}>{t('students.form.lastName')}</Label>
                <Input
                  id={id + 'lastName'}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor={id + 'className'}>{t('students.form.class')}</Label>
                <Input
                  id={id + 'className'}
                  placeholder={t('students.form.classPlaceholder')}
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={id + 'grade'}>{t('students.form.grade')}</Label>
                <Input
                  id={id + 'grade'}
                  type="number"
                  min={5}
                  max={13}
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>{t('students.form.priorities')}</Label>
              {projects.length === 0 ? (
                <p className="text-sm text-destructive">{t('students.form.noProjects')}</p>
              ) : (
                priorities.map((prio, i) => {
                  const otherSelected = new Set(
                    priorities.filter((p, j) => p !== null && j !== i) as string[],
                  );
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-12 text-sm text-muted-foreground">
                        {t('students.prioLabel', { n: i + 1 })}
                      </span>
                      <Select value={prio ?? NONE} onValueChange={(v) => setPriority(i, v)}>
                        <SelectTrigger
                          aria-label={t('students.prioLabel', { n: i + 1 })}
                          className="flex-1 min-w-0"
                        >
                          <SelectValue placeholder={t('students.form.selectPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>{t('students.form.none')}</SelectItem>
                          {compatProjects
                            .filter((p) => !otherSelected.has(p.id))
                            .map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          {incompatProjects.length > 0 && (
                            <>
                              <div className="px-2 py-1 text-xs text-muted-foreground">
                                {t('students.form.gradeIncompatible')}
                              </div>
                              {incompatProjects
                                .filter((p) => !otherSelected.has(p.id))
                                .map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name} ⚠
                                  </SelectItem>
                                ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })
              )}
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
