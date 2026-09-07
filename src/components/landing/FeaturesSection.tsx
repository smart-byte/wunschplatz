import { useTranslation } from 'react-i18next';

const features = ['rounds', 'blueprint', 'import', 'solver', 'editing', 'offline'] as const;

export function FeaturesSection() {
  const { t } = useTranslation('landing');

  return (
    <section className="mx-auto max-w-[720px] px-6 pt-9 sm:px-11">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mark">
        {t('features.kicker')}
      </h2>

      <div className="mt-3.5 grid gap-px border border-rule bg-rule sm:grid-cols-2">
        {features.map((key) => (
          <div key={key} className="bg-white px-5 py-[18px]">
            <h3 className="font-serif text-[15px] font-medium tracking-[-0.01em] text-mark-ink">
              {t(`features.${key}Title`)}
            </h3>
            <p className="mt-1.5 text-[13.5px]/[1.6] text-prose-soft">{t(`features.${key}Text`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
