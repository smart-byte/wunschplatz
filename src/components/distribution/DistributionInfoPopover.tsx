import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HelpCircle } from 'lucide-react';
import type { Distribution } from '@/types';

type Props = {
  distribution: Distribution;
  align?: 'start' | 'center' | 'end';
};

export function DistributionInfoPopover({ distribution, align = 'end' }: Props) {
  const { t, i18n } = useTranslation('app');
  const { run, assignments, createdAt, updatedAt } = distribution;
  const { config, stats, score, timestamp } = run;
  const manualCount = assignments.filter((a) => a.manuallyEdited).length;
  const isManualOnly = run.kind === 'manual' || stats.totalStudents === 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-prose-soft hover:bg-accent hover:text-mark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title={t('distribution.info.triggerTitle')}
          aria-label={t('distribution.info.triggerAriaLabel')}
        >
          <HelpCircle className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className="w-96 max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto p-4 text-xs"
      >
        <div className="space-y-3">
          {!isManualOnly && (
            <p className="text-muted-foreground">{t('distribution.info.snapshotNote')}</p>
          )}
          <div>
            <div className="font-medium text-sm">{distribution.name}</div>
            <div className="text-muted-foreground mt-0.5">
              {t('distribution.info.computedAt', {
                date: new Date(timestamp).toLocaleString(i18n.resolvedLanguage ?? i18n.language),
              })}
            </div>
            {updatedAt !== createdAt && (
              <div className="text-muted-foreground">
                {t('distribution.info.updatedAt', {
                  date: new Date(updatedAt).toLocaleString(i18n.resolvedLanguage ?? i18n.language),
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 border-t pt-3">
            <div className="text-muted-foreground">{t('distribution.info.score')}</div>
            <div className="tabular-nums font-medium">{score}</div>

            <div className="text-muted-foreground">{t('distribution.info.manualEdits')}</div>
            <div className="tabular-nums">{manualCount}</div>

            {!isManualOnly && (
              <>
                <div className="text-muted-foreground">{t('distribution.info.totalStudents')}</div>
                <div className="tabular-nums">{stats.totalStudents}</div>

                <div className="text-muted-foreground">{t('distribution.info.unassigned')}</div>
                <div className="tabular-nums">{stats.unassigned}</div>

                <div className="text-muted-foreground">{t('distribution.info.notInTop5')}</div>
                <div className="tabular-nums">{stats.notInTop5}</div>
              </>
            )}
          </div>

          {!isManualOnly && (
            <div className="border-t pt-3">
              <div className="font-medium mb-1">{t('distribution.info.prioDistribution')}</div>
              <div className="grid grid-cols-5 gap-1 text-center">
                {stats.assignedByPriority.map((count, i) => (
                  <div key={i} className="rounded border px-1.5 py-1">
                    <div className="text-[10px] text-muted-foreground">
                      {t('distribution.prioLabel', { n: i + 1 })}
                    </div>
                    <div className="tabular-nums font-medium">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-3">
            <div className="font-medium mb-1">{t('distribution.info.solverParamsHeading')}</div>
            {isManualOnly && (
              <p className="text-muted-foreground italic mb-2">
                {t('distribution.info.manualOnlyNote')}
              </p>
            )}
            <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
              <div className="text-muted-foreground">{t('distribution.info.priorityWeights')}</div>
              <div className="tabular-nums font-mono">{config.priorityWeights.join(' · ')}</div>
              <div className="text-muted-foreground">{t('distribution.info.unmatchedPenalty')}</div>
              <div className="tabular-nums">{config.unmatchedPenalty}</div>
              <div className="text-muted-foreground">
                {t('distribution.info.overTargetPenalty')}
              </div>
              <div className="tabular-nums">{config.overTargetPenalty}</div>
              <div className="text-muted-foreground">{t('distribution.info.notInTop5Penalty')}</div>
              <div className="tabular-nums">{config.notInTop5Penalty}</div>
              <div className="text-muted-foreground">{t('distribution.info.groupCohesion')}</div>
              <div className="tabular-nums">{config.groupCohesionBonus}</div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
