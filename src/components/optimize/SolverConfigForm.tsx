import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useSolverConfigStore } from '@/store/useSolverConfigStore';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

type InfoBadgeProps = { children: React.ReactNode };

function InfoBadge({ children }: InfoBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex text-muted-foreground hover:text-foreground"
          aria-label="Info"
        >
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

const priorityInfo = [
  'Punkte, die ein Schüler beiträgt, wenn er sein 1. Wunschprojekt bekommt. Höher = der Solver bevorzugt diese Zuweisung stärker.',
  'Punkte für 2. Wunsch. Sollte kleiner als Prio 1 sein, sonst sind Prio 1 und 2 gleichwertig.',
  'Punkte für 3. Wunsch.',
  'Punkte für 4. Wunsch.',
  'Punkte für 5. Wunsch. Sollte ≥ 0 bleiben, sonst wird Prio 5 schlechter als gar keine Zuweisung.',
];

export function SolverConfigForm() {
  const config = useSolverConfigStore((s) => s.config);
  const setConfig = useSolverConfigStore((s) => s.setConfig);
  const reset = useSolverConfigStore((s) => s.reset);

  function updateWeight(index: number, value: number) {
    const next = [...config.priorityWeights] as [number, number, number, number, number];
    next[index] = value;
    setConfig({ ...config, priorityWeights: next });
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6 border rounded-lg p-6 bg-card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold">Prio-Gewichtungen</h2>
            <InfoBadge>
              Punkte pro Prio-Rang. Der Solver maximiert die Summe der vergebenen
              Punkte über alle Schüler. Höher = Solver versucht stärker, Schüler in dieses
              Wunschprojekt zu bekommen. Standard: 10 / 6 / 3 / 2 / 1.
            </InfoBadge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Höher = stärker bevorzugt. Solver maximiert Summe gewichteter Zuweisungen.
          </p>
          <div className="space-y-3">
            {config.priorityWeights.map((w, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-24">
                  <Label>Prio {i + 1}</Label>
                  <InfoBadge>{priorityInfo[i]}</InfoBadge>
                </div>
                <Slider
                  value={[w]}
                  min={0}
                  max={20}
                  step={1}
                  onValueChange={(v) => updateWeight(i, v[0])}
                  className="flex-1"
                />
                <span className="w-12 text-right tabular-nums">{w}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-1.5">
            <div className="flex items-center gap-1">
              <Label htmlFor="unmatched">Unverteilt-Strafe</Label>
              <InfoBadge>
                Straf-Punkte, wenn ein Schüler <strong>überhaupt nicht</strong> verteilt
                wird (kein Projekt zugewiesen). Sehr hoher Wert (Standard 1000) sorgt
                dafür, dass der Solver alle Schüler unterbringt, solange noch ein
                jahrgangskompatibles Projekt freie Plätze hat. Reduzieren nur, wenn du
                Schüler bewusst unverteilt lassen willst.
              </InfoBadge>
            </div>
            <Input
              id="unmatched"
              type="number"
              value={config.unmatchedPenalty}
              onChange={(e) => setConfig({ ...config, unmatchedPenalty: parseInt(e.target.value, 10) || 0 })}
            />
          </div>
          <div className="grid gap-1.5">
            <div className="flex items-center gap-1">
              <Label htmlFor="overTarget">Über-Soll-Strafe</Label>
              <InfoBadge>
                Straf-Punkte für jeden Schüler, der ein Projekt <strong>über
                seine Soll-Kapazität</strong> hinaus füllt (bis zur Max-Kapazität).
                Niedrige Werte (Standard 2) bedeuten "weiches Soll" — Projekte werden
                gleichmäßig auf Soll-Niveau gefüllt, bevor irgendwo überfüllt wird.
                Höher = Solver bleibt strikter beim Soll.
              </InfoBadge>
            </div>
            <Input
              id="overTarget"
              type="number"
              value={config.overTargetPenalty}
              onChange={(e) => setConfig({ ...config, overTargetPenalty: parseInt(e.target.value, 10) || 0 })}
            />
          </div>
          <div className="grid gap-1.5">
            <div className="flex items-center gap-1">
              <Label htmlFor="notInTop5">Nicht-in-Top5-Strafe</Label>
              <InfoBadge>
                Straf-Punkte, wenn ein Schüler in ein Projekt kommt, das <strong>nicht
                in seinen Top 5 Wünschen</strong> stand (passiert nur, wenn alle 5 Wünsche
                voll sind). Standard 50: viel besser als unverteilt (1000), aber deutlich
                schlechter als jeder Top-5-Platz. Höher = Solver lässt eher Plätze leer
                als Schüler in fremdes Projekt zu stecken.
              </InfoBadge>
            </div>
            <Input
              id="notInTop5"
              type="number"
              value={config.notInTop5Penalty}
              onChange={(e) => setConfig({ ...config, notInTop5Penalty: parseInt(e.target.value, 10) || 0 })}
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold">Gruppen-Kohäsion</h3>
            <InfoBadge>
              Bonus-Punkte für jedes zusätzliche Mitglied einer Gruppe im
              <strong> gleichen Projekt</strong>. Höher = der Solver gibt mehr
              Prio-Punkte auf, um Gruppen zusammenzuhalten. Bei <strong>0</strong>
              werden Gruppen wie Einzel-Schüler behandelt.
              <br /><br />
              <span className="font-medium">Faustregel:</span> Gruppe akzeptiert
              Prio-Rang k wenn <code>bonus × (n−1) ≥ (10−w[k]) × n</code>
              (n = Subgruppen-Größe, w = Prio-Gewichtungen). Standard 8 hält
              Gruppen bei Prio 1-2 zusammen, lässt sie ab Prio 3+ eher splitten.
            </InfoBadge>
          </div>
          <div className="flex items-center gap-4">
            <Label htmlFor="groupCohesion" className="w-32">Cohesion-Bonus</Label>
            <Slider
              id="groupCohesion"
              value={[config.groupCohesionBonus]}
              min={0}
              max={30}
              step={1}
              onValueChange={(v) => setConfig({ ...config, groupCohesionBonus: v[0] })}
              className="flex-1"
            />
            <span className="w-12 text-right tabular-nums">{config.groupCohesionBonus}</span>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            if (confirm('Alle Optimierungs-Einstellungen auf Standardwerte zurücksetzen (Prio-Gewichtungen, alle Strafen, Cohesion-Bonus)?')) {
              reset();
            }
          }}
        >
          Alle Werte auf Standard zurücksetzen
        </Button>
      </div>
    </TooltipProvider>
  );
}
