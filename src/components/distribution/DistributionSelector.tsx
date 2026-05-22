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
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { cn } from '@/lib/utils';
import { MoreVertical, Plus, Pencil, Copy, Trash2, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { Distribution } from '@/types';

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
                className="pl-3 pr-1 py-1.5 inline-flex items-center gap-2"
                title={`Score: ${d.run.score} · ${new Date(d.updatedAt).toLocaleString('de-DE')}`}
              >
                <span className={cn(isActive && 'font-medium')}>{d.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">Score {d.run.score}</span>
              </button>
              <DistributionInfoPopover distribution={d} />
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

function DistributionInfoPopover({ distribution }: { distribution: Distribution }) {
  const { run, assignments, createdAt, updatedAt } = distribution;
  const { config, stats, score, timestamp } = run;
  const manualCount = assignments.filter((a) => a.manuallyEdited).length;
  const isManualOnly = stats.totalStudents === 0; // empty run from auto-create

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="px-1.5 py-1.5 text-muted-foreground hover:text-foreground"
          title="Parameter & Details anzeigen"
          aria-label="Info"
        >
          <HelpCircle className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 max-h-[70vh] overflow-y-auto p-4 text-xs">
        <div className="space-y-3">
          <div>
            <div className="font-medium text-sm">{distribution.name}</div>
            <div className="text-muted-foreground mt-0.5">
              Berechnet: {new Date(timestamp).toLocaleString('de-DE')}
            </div>
            {updatedAt !== createdAt && (
              <div className="text-muted-foreground">
                Zuletzt geändert: {new Date(updatedAt).toLocaleString('de-DE')}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 border-t pt-3">
            <div className="text-muted-foreground">Score</div>
            <div className="tabular-nums font-medium">{score}</div>

            <div className="text-muted-foreground">Manuelle Edits</div>
            <div className="tabular-nums">{manualCount}</div>

            {!isManualOnly && (
              <>
                <div className="text-muted-foreground">Schüler gesamt</div>
                <div className="tabular-nums">{stats.totalStudents}</div>

                <div className="text-muted-foreground">Unverteilt</div>
                <div className="tabular-nums">{stats.unassigned}</div>

                <div className="text-muted-foreground">Außerhalb Top-5</div>
                <div className="tabular-nums">{stats.notInTop5}</div>
              </>
            )}
          </div>

          {!isManualOnly && (
            <div className="border-t pt-3">
              <div className="font-medium mb-1">Prio-Verteilung (initial)</div>
              <div className="grid grid-cols-5 gap-1 text-center">
                {stats.assignedByPriority.map((count, i) => (
                  <div key={i} className="rounded border px-1.5 py-1">
                    <div className="text-[10px] text-muted-foreground">Prio {i + 1}</div>
                    <div className="tabular-nums font-medium">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-3">
            <div className="font-medium mb-1">Solver-Parameter</div>
            {isManualOnly && (
              <p className="text-muted-foreground italic mb-2">
                Diese Verteilung wurde manuell ohne Solver-Lauf erstellt — Parameter zeigen Default-Werte.
              </p>
            )}
            <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
              <div className="text-muted-foreground">Prio-Gewichtungen</div>
              <div className="tabular-nums font-mono">
                {config.priorityWeights.join(' · ')}
              </div>
              <div className="text-muted-foreground">Unverteilt-Strafe</div>
              <div className="tabular-nums">{config.unmatchedPenalty}</div>
              <div className="text-muted-foreground">Über-Soll-Strafe</div>
              <div className="tabular-nums">{config.overTargetPenalty}</div>
              <div className="text-muted-foreground">Nicht-in-Top5-Strafe</div>
              <div className="tabular-nums">{config.notInTop5Penalty}</div>
              <div className="text-muted-foreground">Gruppen-Cohesion</div>
              <div className="tabular-nums">{config.groupCohesionBonus}</div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
