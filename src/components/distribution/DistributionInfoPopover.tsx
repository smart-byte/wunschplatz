import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { HelpCircle } from 'lucide-react';
import type { Distribution } from '@/types';

type Props = {
  distribution: Distribution;
  align?: 'start' | 'center' | 'end';
};

export function DistributionInfoPopover({ distribution, align = 'end' }: Props) {
  const { run, assignments, createdAt, updatedAt } = distribution;
  const { config, stats, score, timestamp } = run;
  const manualCount = assignments.filter((a) => a.manuallyEdited).length;
  const isManualOnly = stats.totalStudents === 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
          title="Parameter & Details anzeigen"
          aria-label="Info"
        >
          <HelpCircle className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-96 max-h-[70vh] overflow-y-auto p-4 text-xs">
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
