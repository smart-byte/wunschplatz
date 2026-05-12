import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useSolverConfigStore } from '@/store/useSolverConfigStore';
import { defaultSolverConfig } from '@/types';
import { Button } from '@/components/ui/button';

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
    <div className="space-y-6 border rounded-lg p-6 bg-card">
      <div>
        <h2 className="text-lg font-semibold mb-1">Prio-Gewichtungen</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Höher = stärker bevorzugt. Solver maximiert Summe gewichteter Zuweisungen.
        </p>
        <div className="space-y-3">
          {config.priorityWeights.map((w, i) => (
            <div key={i} className="flex items-center gap-4">
              <Label className="w-20">Prio {i + 1}</Label>
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
          <Label htmlFor="unmatched">Unverteilt-Strafe</Label>
          <Input
            id="unmatched"
            type="number"
            value={config.unmatchedPenalty}
            onChange={(e) => setConfig({ ...config, unmatchedPenalty: parseInt(e.target.value, 10) || 0 })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="overTarget">Über-Soll-Strafe</Label>
          <Input
            id="overTarget"
            type="number"
            value={config.overTargetPenalty}
            onChange={(e) => setConfig({ ...config, overTargetPenalty: parseInt(e.target.value, 10) || 0 })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="notInTop5">Nicht-in-Top5-Strafe</Label>
          <Input
            id="notInTop5"
            type="number"
            value={config.notInTop5Penalty}
            onChange={(e) => setConfig({ ...config, notInTop5Penalty: parseInt(e.target.value, 10) || 0 })}
          />
        </div>
      </div>

      <Button variant="ghost" onClick={reset}>Auf Default ({defaultSolverConfig.priorityWeights.join(', ')}) zurücksetzen</Button>
    </div>
  );
}
