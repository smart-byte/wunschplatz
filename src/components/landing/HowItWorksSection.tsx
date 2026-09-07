import { useTranslation } from 'react-i18next';

const steps = ['step1', 'step2', 'step3'] as const;

export function HowItWorksSection() {
  const { t } = useTranslation('landing');

  return (
    <section className="mx-auto max-w-[720px] px-6 pt-11 sm:px-11">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mark">
        {t('how.kicker')}
      </h2>

      <ol className="mt-1">
        {steps.map((step, i) => (
          <li
            key={step}
            className="grid grid-cols-[34px_1fr] gap-[18px] border-t border-rule py-[18px] last:border-b last:border-rule"
          >
            <span aria-hidden className="pt-[3px] text-[13px] text-quiet/70">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <h3 className="font-serif text-[16px] font-medium tracking-[-0.01em]">
                {t(`how.${step}Title`)}
              </h3>
              <p className="mt-1 text-[14.5px]/[1.6] text-prose-soft">{t(`how.${step}Text`)}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
