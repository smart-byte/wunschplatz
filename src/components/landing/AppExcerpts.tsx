import { Copy, Upload, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BrandIcon } from '@/components/BrandIcon';
import { buildBlueprint } from '@/forms/buildBlueprint';
import { cn } from '@/lib/utils';
import type { BlueprintQuestion } from '@/types';

export type Step = 'form' | 'import' | 'result';

// ponytail: frozen from one solver run on the app's sample data (18 projects, 248 students),
// 2026-09-23. Import counts are illustrative. Refresh by re-running "Beispieldaten" + solver.
const PROJECT_COUNT = 18;
const IMPORT = { found: 248, duplicates: 3 };
const RESULT = { total: 248, unassigned: 0, byWish: [209, 28, 7, 1, 3] };
const CARDS = [
  {
    project: 0,
    count: 22,
    grades: '5-13',
    target: 18,
    students: [
      ['Horn, Nils', '7a', 1],
      ['Schreiber, Vincent', '5b', 1],
      ['Jäger, Alexander', '5c', 1],
    ],
  },
  {
    project: 6,
    count: 14,
    grades: '6-13',
    target: 12,
    students: [
      ['Wolf, Amelie', '12', 1],
      ['Lange, Jasper', '6b', 2],
      ['Schwarz, Hakan', '6b', 1],
    ],
  },
] as const;

// Mirrors StatsPanel rankColors and AssignmentBadge colors.
const WISH_COLORS = ['bg-mark', 'bg-mark-2', 'bg-[#78b9cd]', 'bg-[#a8ced9]', 'bg-[#d0e3e9]'];
const NAV = [
  ['projects', 'form'],
  ['students', 'import'],
  ['optimize', null],
  ['distribution', 'result'],
] as const;
const FADE = '[mask-image:linear-gradient(to_bottom,#000_calc(100%-56px),transparent)]';

function FakeButton({ primary, children }: { primary?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded px-2.5 py-[5px] text-[11px] font-medium',
        primary ? 'bg-mark text-white' : 'border border-rule bg-white',
      )}
    >
      {children}
    </span>
  );
}

function FakeTabs({
  items,
  active,
  stretch,
}: {
  items: string[];
  active: number;
  stretch?: boolean;
}) {
  return (
    <span
      className={cn('rounded-[5px] bg-muted p-[3px] text-[11px]', stretch ? 'flex' : 'inline-flex')}
    >
      {items.map((item, i) => (
        <span
          key={item}
          className={cn(
            'rounded-[3px] px-2.5 py-[3px] text-prose-soft',
            stretch && 'flex-1 text-center',
            i === active &&
              'bg-white font-medium text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.08)]',
          )}
        >
          {item}
        </span>
      ))}
    </span>
  );
}

export function AppFrame({ step, children }: { step: Step; children: React.ReactNode }) {
  const { t } = useTranslation('app');
  return (
    <div className="overflow-hidden rounded-lg border border-rule bg-paper text-xs shadow-[0_10px_30px_-18px_rgba(38,48,110,0.35),0_1px_2px_rgba(15,23,42,0.04)]">
      <div
        aria-hidden
        className="flex h-9 items-center gap-[18px] border-b border-rule bg-white px-3.5"
      >
        <span className="mr-1.5 flex items-center gap-1.5 text-xs font-semibold">
          <BrandIcon className="size-4" />
          <span className="max-sm:hidden">Wunschplatz</span>
        </span>
        <span className="flex h-full gap-3.5">
          {NAV.map(([key, navStep]) => (
            <span
              key={key}
              className={cn(
                'flex items-center border-b-2 border-transparent text-[11.5px] text-prose-soft',
                navStep === step && 'border-mark font-semibold text-mark',
              )}
            >
              {t(`nav.${key}`)}
            </span>
          ))}
        </span>
      </div>
      {children}
    </div>
  );
}

export function FormExcerpt() {
  const { t } = useTranslation(['landing', 'app']);
  const names = t('how.sampleProjects', { returnObjects: true }) as string[];
  const result = buildBlueprint(
    names.map((name, i) => ({
      id: String(i),
      name,
      grades: [],
      maxCapacity: 0,
      targetCapacity: 0,
    })),
    '',
  );
  if (!result.ok) return null;
  const { identity, priorities, projectOptions } = result.blueprint;
  const questions = [...identity, ...priorities];
  const typeLabel = (q: BlueprintQuestion) =>
    t(`app:blueprint.questionType.${q.type === 'short_text' ? 'text' : q.type}`);

  return (
    <div className={cn('h-[330px] overflow-hidden p-3.5', FADE)}>
      <div className="rounded-md border border-rule bg-white px-3.5 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13.5px] font-medium">{t('app:blueprint.heading')}</p>
            <p className="mt-0.5 text-[11px]/[1.4] text-prose-soft">
              {t('app:blueprint.description', { count: PROJECT_COUNT })}
            </p>
          </div>
          <FakeButton primary>{t('app:blueprint.regenerate')}</FakeButton>
        </div>
        <div className="mt-2.5">
          <FakeTabs
            items={[t('app:blueprint.tabs.google'), t('app:blueprint.tabs.microsoft')]}
            active={0}
          />
        </div>
        <div className="mt-3 grid gap-3.5 sm:grid-cols-2">
          <div className="max-sm:hidden">
            <div className="mb-1.5 flex min-h-[22px] items-center justify-between gap-2 text-[11px] font-semibold">
              {t('app:blueprint.optionsLabel')}
              <FakeButton>
                <Copy className="size-3" />
                {t('app:blueprint.copyOptions')}
              </FakeButton>
            </div>
            <pre className="overflow-hidden rounded border border-rule bg-[#fafaf8] px-2 py-1.5 font-mono text-[10px]/[1.6]">
              {[...projectOptions.map((o) => o.label), '…'].join('\n')}
            </pre>
          </div>
          <div>
            <p className="mb-1.5 flex min-h-[22px] items-center text-[11px] font-semibold">
              {t('app:blueprint.questionsCount', { count: questions.length })}
            </p>
            {questions.map((q) => (
              <div
                key={q.key}
                className="mb-1 flex justify-between gap-2 rounded border border-rule bg-white px-2 py-1 text-[11px]"
              >
                <span>{q.title}</span>
                <span className="text-[10px] text-prose-soft">
                  {typeLabel(q)}
                  {q.required ? t('app:blueprint.required') : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ImportExcerpt() {
  const { t } = useTranslation(['landing', 'app']);
  return (
    <div className="relative h-[330px] overflow-hidden">
      <p className="px-4 pt-4 font-serif text-xl opacity-55">{t('app:nav.students')}</p>
      <div className="absolute inset-0 bg-[rgba(15,23,42,0.22)]" />
      <div className="absolute left-1/2 top-1/2 w-[min(410px,calc(100%-24px))] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white px-[18px] py-4 shadow-[0_20px_40px_-12px_rgba(15,23,42,0.35)]">
        <div className="flex justify-between gap-3 text-sm font-semibold">
          {t('app:import.formsTitle')}
          <X className="size-3.5 shrink-0 text-quiet" />
        </div>
        <div className="mt-3 sm:whitespace-nowrap">
          <FakeTabs
            stretch
            items={[t('app:import.tabExcel'), t('app:import.tabForms')]}
            active={1}
          />
        </div>
        <div className="mt-3">
          <FakeButton>
            <Upload className="size-3" />
            {t('app:common.chooseFile')}
          </FakeButton>
        </div>
        <p className="mt-2.5">{t('app:import.fileLabel', { fileName: t('how.sampleFile') })}</p>
        <p className="mt-2.5">
          {t('app:import.foundPrefix')} <strong>{IMPORT.found}</strong>{' '}
          {t('app:import.validRow', { count: IMPORT.found })}
        </p>
        <p className="mt-2 text-[10.5px] text-prose-soft">
          {t('app:import.duplicatesRemoved', { count: IMPORT.duplicates })}
        </p>
        <p className="mt-2 text-[10.5px] text-prose-soft">{t('app:import.replaceWarning')}</p>
        <div className="mt-3.5 flex justify-end gap-2">
          <FakeButton>{t('app:common.cancel')}</FakeButton>
          <FakeButton primary>{t('app:import.confirm', { count: IMPORT.found })}</FakeButton>
        </div>
      </div>
    </div>
  );
}

export function ResultExcerpt() {
  const { t, i18n } = useTranslation(['landing', 'app']);
  const names = t('how.sampleProjects', { returnObjects: true }) as string[];
  const firstWish = new Intl.NumberFormat(i18n.resolvedLanguage, {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(RESULT.byWish[0] / RESULT.total);
  const stats = [
    [
      t('app:distribution.stats.assignedLabel'),
      RESULT.total - RESULT.unassigned,
      `/${RESULT.total}`,
    ],
    [t('app:distribution.stats.firstWish'), firstWish, null],
    [t('app:distribution.stats.unassignedLabel'), RESULT.unassigned, null],
  ] as const;

  return (
    <div className={cn('h-[330px] overflow-hidden p-3.5', FADE)}>
      <dl className="grid grid-cols-3 gap-2.5">
        {stats.map(([label, value, suffix], i) => (
          <div key={label}>
            <dt className="text-[10.5px] text-prose-soft">{label}</dt>
            <dd
              className={cn(
                'mt-1 font-serif text-[26px] leading-none tabular-nums',
                i === 1 ? 'text-mark' : 'text-mark-ink',
              )}
            >
              {value}
              {suffix && <span className="text-sm text-prose-soft">{suffix}</span>}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-3.5 flex h-[5px] overflow-hidden rounded-full bg-muted">
        {RESULT.byWish.map((n, i) => (
          <div
            key={i}
            className={WISH_COLORS[i]}
            style={{ width: `${(n / RESULT.total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-prose-soft">
        {RESULT.byWish.map((n, i) => (
          <li key={i} className="inline-flex items-center gap-1">
            <span className={cn('size-[5px] rounded-full', WISH_COLORS[i])} />
            {t('app:distribution.prioLabel', { n: i + 1 })}
            <span className="ml-0.5 font-medium tabular-nums text-prose">{n}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
        {CARDS.map((card) => (
          <div
            key={card.project}
            className="rounded-[7px] border border-rule bg-white max-sm:[&:nth-child(2)]:hidden"
          >
            <div className="px-3 pb-2.5 pt-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-serif text-[15px] text-mark-ink">{names[card.project]}</span>
                <span className="text-[13px] font-medium tabular-nums text-mark-ink">
                  {card.count}
                  <span className="text-[10.5px] font-normal text-prose-soft">/{card.count}</span>
                </span>
              </div>
              <div className="mt-0.5 flex justify-between text-[10px] text-prose-soft">
                <span>{t('app:distribution.card.grades', { grades: card.grades })}</span>
                <span>{t('app:distribution.card.targetAria', { target: card.target })}</span>
              </div>
              <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-mark/[0.07]">
                <div className="h-full w-full bg-mark" />
              </div>
            </div>
            <div className="border-t border-rule-soft px-2 pb-1.5 pt-1">
              {card.students.map(([name, className, rank]) => (
                <div key={name} className="flex items-center gap-1.5 px-1 py-1 text-[10.5px]">
                  <span className="flex-1">{name}</span>
                  <span className="text-[10px] text-prose-soft">{className}</span>
                  <span
                    className={cn(
                      'rounded-sm px-[5px] py-px text-[9.5px] font-medium',
                      rank === 1 ? 'bg-mark/[0.08] text-mark' : 'bg-mark-2/[0.08] text-[#18758f]',
                    )}
                  >
                    {t('app:distribution.prioLabel', { n: rank })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
