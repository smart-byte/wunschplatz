import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useStudentsStore } from '@/store/useStudentsStore';
import { getGroupMembers, getGroupColor } from '@/lib/groups';
import { Users } from 'lucide-react';
import type { Student } from '@/types';

type Props = {
  trigger: React.ReactNode;
  initial?: Student;
  onSave: (data: Omit<Student, 'id'>) => void;
};

const NONE = '__none__';

export function StudentFormDialog({ trigger, initial, onSave }: Props) {
  const projects = useProjectsStore((s) => s.projects);
  const allStudents = useStudentsStore((s) => s.students);
  const groupColors = useStudentsStore((s) => s.groupColors);
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [className, setClassName] = useState('');
  const [grade, setGrade] = useState(7);
  const [priorities, setPriorities] = useState<(string | null)[]>([null, null, null, null, null]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFirstName(initial?.firstName ?? '');
    setLastName(initial?.lastName ?? '');
    setClassName(initial?.className ?? '');
    setGrade(initial?.grade ?? 7);
    const initPrios = [null, null, null, null, null] as (string | null)[];
    initial?.priorities.slice(0, 5).forEach((id, i) => { initPrios[i] = id; });
    setPriorities(initPrios);
    setError(null);
  }, [open, initial]);

  function setPriority(index: number, value: string) {
    const next = [...priorities];
    next[index] = value === NONE ? null : value;
    setPriorities(next);
  }

  function handleSave() {
    if (!firstName.trim()) { setError('Vorname erforderlich.'); return; }
    if (!lastName.trim()) { setError('Nachname erforderlich.'); return; }
    if (!className.trim()) { setError('Klasse erforderlich.'); return; }
    if (grade < 5 || grade > 13) { setError('Jahrgang muss zwischen 5 und 13 liegen.'); return; }

    const cleaned = priorities.filter((p): p is string => p !== null);
    const unique = new Set(cleaned);
    if (unique.size !== cleaned.length) {
      setError('Prioritäten müssen unterschiedlich sein.');
      return;
    }
    if (cleaned.length === 0) {
      setError('Mindestens eine Priorität wählen.');
      return;
    }
    onSave({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      className: className.trim(),
      grade,
      priorities: cleaned,
    });
    setOpen(false);
  }

  const siblings = initial?.groupId
    ? getGroupMembers(allStudents, initial.groupId).filter((m) => m.id !== initial.id)
    : [];
  const groupColor = initial?.groupId ? getGroupColor(initial.groupId, groupColors) : null;

  const compatProjects = projects.filter((p) => p.grades.includes(grade));
  const incompatProjects = projects.filter((p) => !p.grades.includes(grade));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? 'Schüler bearbeiten' : 'Neuer Schüler'}</DialogTitle>
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
                  ? { backgroundColor: groupColor.hex + '33', color: groupColor.hex }
                  : undefined
              }
            >
              <Users className="size-4 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium">In Gruppe ({groupColor.label})</p>
                <p className="text-xs opacity-80">
                  Prio-Änderungen wirken für alle Mitglieder: {siblings.map((s) => `${s.firstName} ${s.lastName}`).join(', ') || '(nur dieser Schüler)'}
                </p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="firstName">Vorname</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="lastName">Nachname</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="className">Klasse</Label>
              <Input id="className" placeholder="z.B. 7a" value={className} onChange={(e) => setClassName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="grade">Jahrgang</Label>
              <Input
                id="grade" type="number" min={5} max={13}
                value={grade}
                onChange={(e) => setGrade(parseInt(e.target.value, 10) || 7)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Prioritäten (1 = höchster Wunsch)</Label>
            {projects.length === 0 ? (
              <p className="text-sm text-destructive">Noch keine Projekte angelegt.</p>
            ) : (
              priorities.map((prio, i) => {
                const otherSelected = new Set(
                  priorities.filter((p, j) => p !== null && j !== i) as string[],
                );
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-12 text-sm text-muted-foreground">Prio {i + 1}</span>
                    <Select value={prio ?? NONE} onValueChange={(v) => setPriority(i, v)}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="— wählen —" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>— keine —</SelectItem>
                        {compatProjects
                          .filter((p) => !otherSelected.has(p.id))
                          .map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        {incompatProjects.length > 0 && (
                          <>
                            <div className="px-2 py-1 text-xs text-muted-foreground">Jahrgang nicht passend:</div>
                            {incompatProjects
                              .filter((p) => !otherSelected.has(p.id))
                              .map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name} ⚠</SelectItem>
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

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
          <Button onClick={handleSave}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
