import { useTranslation } from 'react-i18next';

const points = ['point1', 'point2', 'point3'] as const;

export function PrivacySection() {
  const { t } = useTranslation('landing');

  return (
    <section className="mx-auto max-w-[720px] px-6 pt-11 sm:px-11">
      <div className="border border-rule bg-white px-7 py-8 sm:px-9">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mark">
          {t('privacy.kicker')}
        </h2>
        <p className="mt-4 max-w-[22ch] font-serif text-[24px]/[1.2] font-medium tracking-[-0.015em]">
          {t('privacy.title')}
        </p>
        <p className="mt-3.5 text-[15px]/[1.65] text-prose">{t('privacy.text')}</p>

        <ul className="mt-6">
          {points.map((point) => (
            <li
              key={point}
              className="grid grid-cols-[18px_1fr] gap-3 border-t border-rule-soft py-2.5 text-[13.5px] text-prose-soft"
            >
              <span aria-hidden className="text-mark-2">
                ✓
              </span>
              {t(`privacy.${point}`)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
