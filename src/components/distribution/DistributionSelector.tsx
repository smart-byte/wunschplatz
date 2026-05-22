import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { cn } from '@/lib/utils';
import { MoreVertical, Plus, Pencil, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function DistributionSelector() {
  const navigate = useNavigate();
  const distributions = useAssignmentsStore((s) => s.distributions);
  const activeId = useAssignmentsStore((s) => s.activeId);
  const setActive = useAssignmentsStore((s) => s.setActive);
  const renameDistribution = useAssignmentsStore((s) => s.renameDistribution);
  const duplicateDistribution = useAssignmentsStore((s) => s.duplicateDistribution);
  const removeDistribution = useAssignmentsStore((s) => s.removeDistribution);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [nameInput, setNameInput] = useState('');

  function startRename(id: string, currentName: string) {
    setRenameTarget({ id, name: currentName });
    setNameInput(currentName);
    setRenameOpen(true);
  }

  function commitRename() {
    if (!renameTarget) return;
    renameDistribution(renameTarget.id, nameInput);
    setRenameOpen(false);
    setRenameTarget(null);
    toast.success('Umbenannt');
  }

  if (distributions.length === 0) {
    return (
      <div className="border rounded-lg p-4 bg-card flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Noch keine Verteilung. Starte die Optimierung oder weise Schüler unten manuell zu —
          beim ersten Klick wird automatisch eine neue Verteilung angelegt.
        </p>
        <Button onClick={() => navigate('/optimize')}>
          <Plus className="size-4 mr-2" />
          Optimierung starten
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg p-3 bg-card flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground mr-2">Verteilungen:</span>
        {distributions.map((d) => {
          const isActive = d.id === activeId;
          return (
            <div
              key={d.id}
              className={cn(
                'inline-flex items-center gap-1 rounded-md border text-sm transition-colors',
                isActive ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted',
              )}
            >
              <button
                type="button"
                onClick={() => setActive(d.id)}
                className="px-3 py-1.5 inline-flex items-center gap-2"
                title={`Score: ${d.run.score} · ${new Date(d.updatedAt).toLocaleString('de-DE')}`}
              >
                <span className={cn(isActive && 'font-medium')}>{d.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">Score {d.run.score}</span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="px-1.5 py-1.5 hover:bg-muted/60 rounded-r-md"
                    title="Aktionen"
                  >
                    <MoreVertical className="size-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => startRename(d.id, d.name)}>
                    <Pencil className="size-4 mr-2" /> Umbenennen
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const id = duplicateDistribution(d.id, `${d.name} (Kopie)`);
                      if (id) toast.success('Dupliziert');
                    }}
                  >
                    <Copy className="size-4 mr-2" /> Duplizieren
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      if (confirm(`Verteilung "${d.name}" löschen?`)) {
                        removeDistribution(d.id);
                        toast.success('Gelöscht');
                      }
                    }}
                  >
                    <Trash2 className="size-4 mr-2" /> Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => navigate('/optimize')}>
          <Plus className="size-4 mr-2" />
          Neue Verteilung
        </Button>
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verteilung umbenennen</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="dist-name">Name</Label>
            <Input
              id="dist-name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Abbrechen</Button>
            <Button onClick={commitRename}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
