import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import type { Project } from '@/types';

type Props = {
  trigger: React.ReactNode;
  initial?: Project;
  onSave: (data: Omit<Project, 'id'>) => void;
};

export function ProjectFormDialog({ trigger, initial, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [gradesText, setGradesText] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(20);
  const [targetCapacity, setTargetCapacity] = useState(15);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setDescription(initial?.description ?? '');
    setGradesText(initial?.grades.join(', ') ?? '');
    setMaxCapacity(initial?.maxCapacity ?? 20);
    setTargetCapacity(initial?.targetCapacity ?? 15);
    setError(null);
  }, [open, initial]);

  function handleSave() {
    const grades = gradesText
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 5 && n <= 13);
    if (!name.trim()) { setError('Name erforderlich.'); return; }
    if (grades.length === 0) { setError('Mindestens ein Jahrgang erforderlich (5-13).'); return; }
    if (maxCapacity <= 0) { setError('Max-Kapazität muss positiv sein.'); return; }
    if (targetCapacity < 0 || targetCapacity > maxCapacity) {
      setError('Soll muss zwischen 0 und Max liegen.');
      return;
    }
    onSave({ name: name.trim(), description: description.trim() || undefined, grades, maxCapacity, targetCapacity });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? 'Projekt bearbeiten' : 'Neues Projekt'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="desc">Beschreibung (optional)</Label>
            <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="grades">Jahrgänge (kommagetrennt, z.B. "5, 6, 7")</Label>
            <Input id="grades" value={gradesText} onChange={(e) => setGradesText(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="max">Max-Kapazität</Label>
              <Input
                id="max" type="number" value={maxCapacity}
                onChange={(e) => setMaxCapacity(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="target">Soll-Kapazität</Label>
              <Input
                id="target" type="number" value={targetCapacity}
                onChange={(e) => setTargetCapacity(parseInt(e.target.value, 10) || 0)}
              />
            </div>
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
