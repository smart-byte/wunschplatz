import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppFrame, FormExcerpt, ImportExcerpt, ResultExcerpt, type Step } from './AppExcerpts';

const steps = [
  { key: 'form', n: 1, where: ['nav.projects', 'blueprint.heading'], Excerpt: FormExcerpt },
  {
    key: 'import',
    n: 2,
    where: ['nav.students', 'students.importFormResults'],
    Excerpt: ImportExcerpt,
  },
  { key: 'result', n: 3, where: ['nav.optimize', 'nav.distribution'], Excerpt: ResultExcerpt },
] as const;

export function HowItWorksSection() {
  const { t } = useTranslation(['landing', 'app']);
  const [step, setStep] = useState<Step>('form');

  // Hover follows real mouse movement only, with no delay: a step scrolling under a
  // resting pointer fires enter/over but no pointermove, and a touch drag is a scroll.
  const hoverTo = (next: Step) => (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') setStep(next);
  };

  return (
    <section className="landing-steps px-6 pt-16 sm:px-11">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mark">
          {t('how.kicker')}
        </h2>
        <p className="text-[12px] text-quiet">{t('how.hint')}</p>
      </div>

      <Tabs
        value={step}
        onValueChange={(value) => setStep(value as Step)}
        orientation="vertical"
        className="mt-[22px] lg:grid lg:grid-cols-[232px_1fr] lg:items-start lg:gap-6"
      >
        <TabsList className="flex h-auto flex-col items-stretch gap-1.5 bg-transparent p-0 text-foreground">
          {steps.map(({ key, n, where }) => (
            <TabsTrigger
              key={key}
              value={key}
              onPointerMove={hoverTo(key)}
              className="group grid transition-none grid-cols-[26px_1fr] content-start items-start justify-items-start gap-x-2 gap-y-0.5 whitespace-normal rounded-md border-l-[3px] border-transparent py-3 pl-3 pr-3.5 text-left font-normal hover:bg-mark/[0.04] data-[state=active]:border-mark data-[state=active]:bg-white data-[state=active]:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_0_0_1px_#e7e5e0]"
            >
              <span
                aria-hidden
                className="row-span-3 mt-px text-[13.5px] font-semibold tracking-[0.04em] text-prose-soft group-data-[state=active]:text-mark"
              >
                {String(n).padStart(2, '0')}
              </span>
              <span className="font-serif text-[16px] font-medium tracking-[-0.01em]">
                {t(`how.step${n}Title`)}
              </span>
              <span className="text-[13px]/[1.5] text-prose-soft max-lg:group-data-[state=inactive]:hidden">
                {t(`how.step${n}Text`)}
              </span>
              <span className="mt-1 text-[11px] text-quiet group-data-[state=active]:text-mark max-lg:group-data-[state=inactive]:hidden">
                {t(`app:${where[0]}`)} → {t(`app:${where[1]}`)}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="max-lg:mt-4">
          <AppFrame step={step}>
            {steps.map(({ key, where, Excerpt }) => (
              <TabsContent key={key} value={key} className="mt-0 ring-offset-paper">
                <div role="img" aria-label={`${t(`app:${where[0]}`)} → ${t(`app:${where[1]}`)}`}>
                  <Excerpt />
                </div>
              </TabsContent>
            ))}
          </AppFrame>
          <p className="mx-0.5 mt-2.5 text-[12px] italic text-quiet">{t('how.caption')}</p>
        </div>
      </Tabs>
    </section>
  );
}
