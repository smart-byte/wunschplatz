import { useTranslation } from 'react-i18next';
import { useDistributionData } from '@/hooks/useDistributionData';
import { distributionStats } from '@/lib/distribution';
import { cn } from '@/lib/utils';

const rankColors = ['bg-mark', 'bg-mark-2', 'bg-[#78b9cd]', 'bg-[#a8ced9]', 'bg-[#d0e3e9]'];

export function StatsPanel() {
  const { t, i18n } = useTranslation('app');
  const { rows } = useDistributionData();
  const { totalStudents, assignedByPriority, notInTop5, unassigned } = distributionStats(
    rows.map((row) => row.assignment),
  );
  const assigned = totalStudents - unassigned;
  const wished = assigned - notInTop5;
  const firstWish = new Intl.NumberFormat(i18n.resolvedLanguage ?? i18n.language, {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(totalStudents ? assignedByPriority[0] / totalStudents : 0);
  const segments = [
    ...assignedByPriority.map((count, i) => ({
      label: t('distribution.prioLabel', { n: i + 1 }),
      count,
      color: rankColors[i],
    })),
    { label: t('distribution.badge.outsideLabel'), count: notInTop5, color: 'bg-stone-300' },
    { label: t('distribution.board.unassignedHeading'), count: unassigned, color: 'bg-amber-400' },
  ];

  return (
    <section
      aria-label={t('distribution.stats.heading')}
      className="border-y border-rule py-6 sm:py-7"
    >
      <dl className="grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4 lg:gap-8">
        <div>
          <dt className="text-xs text-prose-soft">{t('distribution.stats.assignedLabel')}</dt>
          <dd className="mt-2 font-serif text-3xl tabular-nums text-mark-ink sm:text-4xl">
            {assigned}
            <span className="text-xl text-prose-soft">/{totalStudents}</span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-prose-soft">{t('distribution.stats.firstWish')}</dt>
          <dd className="mt-2 font-serif text-3xl tabular-nums text-mark sm:text-4xl">
            {firstWish}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-prose-soft">{t('distribution.stats.wished')}</dt>
          <dd className="mt-2 font-serif text-3xl tabular-nums text-mark-ink sm:text-4xl">
            {wished}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-prose-soft">{t('distribution.stats.unassignedLabel')}</dt>
          <dd
            className={cn(
              'mt-2 font-serif text-3xl tabular-nums sm:text-4xl',
              unassigned ? 'text-amber-800' : 'text-mark-ink',
            )}
          >
            {unassigned}
          </dd>
        </div>
      </dl>
      <div aria-hidden className="mt-7 flex h-1.5 overflow-hidden rounded-full bg-muted">
        {segments.map(({ label, count, color }) => (
          <div
            key={label}
            className={color}
            style={{ width: `${totalStudents ? (count / totalStudents) * 100 : 0}%` }}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-prose-soft">
        {segments
          .filter((segment, index) => index < 5 || segment.count > 0)
          .map(({ label, count, color }) => (
            <li key={label} className="inline-flex items-center gap-1.5">
              <span aria-hidden className={cn('size-1.5 rounded-full', color)} />
              {label}
              <span className="ml-0.5 font-medium tabular-nums text-prose">{count}</span>
            </li>
          ))}
      </ul>
    </section>
  );
}
