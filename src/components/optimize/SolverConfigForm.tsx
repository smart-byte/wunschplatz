import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useSolverConfigStore } from '@/store/useSolverConfigStore';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, Info, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { parseInteger } from '@/lib/validation';

type InfoBadgeProps = { children: React.ReactNode };

function InfoBadge({ children }: InfoBadgeProps) {
  const { t } = useTranslation('app');
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-prose-soft hover:text-mark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t('optimize.infoLabel')}
        >
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm text-xs leading-relaxed space-y-1">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

// Penalties are whole numbers from 0: a negative one would reward the outcome it should prevent.
// Invalid text stays visible and marked instead of being truncated into another number.
function PenaltyInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const { t } = useTranslation('app');
  const [draft, setDraft] = useState(String(value));
  const [shown, setShown] = useState(value);
  if (value !== shown) {
    // Follow outside changes, such as a reset.
    setShown(value);
    setDraft(String(value));
  }
  const invalid = parseInteger(draft) === null;
  return (
    <>
      <Input
        id={id}
        type="number"
        min={0}
        step={1}
        value={draft}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
        className={invalid ? 'border-destructive' : undefined}
        onChange={(e) => {
          setDraft(e.target.value);
          const next = parseInteger(e.target.value);
          if (next !== null) onChange(next);
        }}
        onBlur={() => setDraft(String(value))}
      />
      {invalid && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {t('optimize.penalty.invalid')}
        </p>
      )}
    </>
  );
}

export function SolverConfigForm({ disabled = false }: { disabled?: boolean }) {
  const { t } = useTranslation('app');
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
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-serif text-2xl font-medium">{t('optimize.priority.heading')}</h2>
            <InfoBadge>{t('optimize.priority.headingInfo')}</InfoBadge>
          </div>
          <p className="text-sm leading-relaxed text-prose-soft mb-6">
            {t('optimize.priority.description')}
          </p>
          <div className="space-y-5">
            {config.priorityWeights.map((w, i) => (
              <div key={i} className="flex items-center gap-3 sm:gap-5">
                <div className="flex w-28 shrink-0 items-center">
                  <Label htmlFor={`priority-${i}`}>
                    {t('optimize.priority.label', { n: i + 1 })}
                  </Label>
                  <InfoBadge>{t(`optimize.priority.info${i + 1}`)}</InfoBadge>
                </div>
                <Slider
                  disabled={disabled}
                  id={`priority-${i}`}
                  aria-label={t('optimize.priority.label', { n: i + 1 })}
                  value={[w]}
                  min={0}
                  max={20}
                  step={1}
                  onValueChange={(v) => updateWeight(i, v[0])}
                  className="flex-1"
                />
                <span className="w-8 text-right text-sm font-medium tabular-nums text-mark-ink">
                  {w}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-rule pt-7">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-serif text-2xl font-medium">{t('optimize.cohesion.heading')}</h3>
            <InfoBadge>
              <p>
                {t('optimize.cohesion.info.introPre')}{' '}
                <strong>{t('optimize.cohesion.info.introStrong')}</strong>
                {t('optimize.cohesion.info.introMid')} <strong>0</strong>{' '}
                {t('optimize.cohesion.info.introEnd')}
              </p>
              <div className="mt-3">
                <p className="font-medium mb-1">{t('optimize.cohesion.info.ruleHeading')}</p>
                <p>{t('optimize.cohesion.info.ruleIntro')}</p>
                <div className="mt-2 rounded border bg-muted/50 px-3 py-2 font-mono text-[11px] leading-relaxed">
                  <div>{t('optimize.cohesion.info.formulaLabel')}</div>
                  <div className="mt-1 text-muted-foreground">
                    Bonus · (n − 1) ≥ (w₁ − w<sub>k</sub>) · n
                  </div>
                </div>
                <ul className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
                  <li>
                    <strong>n</strong> = {t('optimize.cohesion.info.legendN')}
                  </li>
                  <li>
                    <strong>k</strong> = {t('optimize.cohesion.info.legendK')}
                  </li>
                  <li>
                    <strong>
                      w₁, w<sub>k</sub>
                    </strong>{' '}
                    = {t('optimize.priority.heading')}
                  </li>
                </ul>
              </div>
              <p className="mt-3 text-muted-foreground">
                {t('optimize.cohesion.info.defaultPre')}{' '}
                <strong className="text-foreground">8</strong>
                {t('optimize.cohesion.info.defaultPost')}
              </p>
            </InfoBadge>
          </div>
          <p className="mb-5 text-sm leading-relaxed text-prose-soft">
            {t('optimize.cohesion.description')}
          </p>
          <div className="flex items-center gap-3 sm:gap-5">
            <Label htmlFor="groupCohesion" className="w-28 shrink-0">
              {t('optimize.cohesion.label')}
            </Label>
            <Slider
              disabled={disabled}
              id="groupCohesion"
              aria-label={t('optimize.cohesion.label')}
              value={[config.groupCohesionBonus]}
              min={0}
              max={30}
              step={1}
              onValueChange={(v) => setConfig({ ...config, groupCohesionBonus: v[0] })}
              className="flex-1"
            />
            <span className="w-8 text-right text-sm font-medium tabular-nums text-mark-ink">
              {config.groupCohesionBonus}
            </span>
          </div>
        </div>

        <details className="group border-y border-rule py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-sm text-sm font-medium text-prose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            {t('optimize.advanced.heading')}
            <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
          </summary>
          <p className="mb-5 mt-3 text-sm leading-relaxed text-prose-soft">
            {t('optimize.advanced.description')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="grid gap-1.5">
              <div className="flex items-center gap-1">
                <Label htmlFor="unmatched">{t('optimize.penalty.unmatched.label')}</Label>
                <InfoBadge>
                  {t('optimize.penalty.unmatched.infoPre')}{' '}
                  <strong>{t('optimize.penalty.unmatched.infoStrong')}</strong>{' '}
                  {t('optimize.penalty.unmatched.infoPost')}
                </InfoBadge>
              </div>
              <PenaltyInput
                id="unmatched"
                value={config.unmatchedPenalty}
                onChange={(value) => setConfig({ ...config, unmatchedPenalty: value })}
              />
            </div>
            <div className="grid gap-1.5">
              <div className="flex items-center gap-1">
                <Label htmlFor="overTarget">{t('optimize.penalty.overTarget.label')}</Label>
                <InfoBadge>
                  {t('optimize.penalty.overTarget.infoPre')}{' '}
                  <strong>{t('optimize.penalty.overTarget.infoStrong')}</strong>{' '}
                  {t('optimize.penalty.overTarget.infoPost')}
                </InfoBadge>
              </div>
              <PenaltyInput
                id="overTarget"
                value={config.overTargetPenalty}
                onChange={(value) => setConfig({ ...config, overTargetPenalty: value })}
              />
            </div>
            <div className="grid gap-1.5">
              <div className="flex items-center gap-1">
                <Label htmlFor="notInTop5">{t('optimize.penalty.notInTop5.label')}</Label>
                <InfoBadge>
                  {t('optimize.penalty.notInTop5.infoPre')}{' '}
                  <strong>{t('optimize.penalty.notInTop5.infoStrong')}</strong>{' '}
                  {t('optimize.penalty.notInTop5.infoPost')}
                </InfoBadge>
              </div>
              <PenaltyInput
                id="notInTop5"
                value={config.notInTop5Penalty}
                onChange={(value) => setConfig({ ...config, notInTop5Penalty: value })}
              />
            </div>
          </div>
        </details>

        <Button
          variant="ghost"
          className="text-prose-soft"
          onClick={() => {
            if (confirm(t('optimize.reset.confirm'))) {
              reset();
            }
          }}
        >
          <RotateCcw className="size-4" />
          {t('optimize.reset.button')}
        </Button>
      </div>
    </TooltipProvider>
  );
}
