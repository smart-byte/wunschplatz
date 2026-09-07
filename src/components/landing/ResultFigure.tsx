import { useTranslation } from 'react-i18next';

type ExampleRow = { name: string; className: string; project: string; wish: number };

const COLS =
  'grid-cols-[1fr_1.3fr_40px] gap-2.5 px-3 py-[9px] sm:grid-cols-[1.1fr_1.6fr_70px] sm:gap-3.5 sm:px-4';

export function ResultFigure() {
  const { t } = useTranslation('landing');
  const rows = t('figure.rows', { returnObjects: true }) as ExampleRow[];

  return (
    <figure className="mx-auto mt-[34px] max-w-[860px] px-6 sm:px-11">
      <div role="table" aria-label={t('figure.caption')} className="border border-rule bg-white">
        <div
          role="row"
          className={`grid ${COLS} border-b border-rule bg-mark/[0.05] text-[10.5px] font-bold uppercase tracking-[0.1em] text-quiet`}
        >
          <span role="columnheader">{t('figure.student')}</span>
          <span role="columnheader">{t('figure.project')}</span>
          <span role="columnheader" className="text-right">
            {t('figure.wish')}
          </span>
        </div>

        {rows.map((row) => (
          <div
            role="row"
            key={row.name}
            className={`grid ${COLS} items-baseline border-b border-rule-soft text-[13px] last:border-b-0`}
          >
            <span role="cell">
              {row.name} <span className="text-[11.5px] text-quiet">{row.className}</span>
            </span>
            <span role="cell">{row.project}</span>
            <span
              role="cell"
              className={`justify-self-end text-[11.5px] font-semibold ${
                row.wish === 1 ? 'text-mark' : 'text-mark-2'
              }`}
            >
              {row.wish}.
            </span>
          </div>
        ))}
      </div>

      <figcaption className="mx-0.5 mt-2.5 text-[12.5px] italic text-quiet">
        {t('figure.caption')}
      </figcaption>
    </figure>
  );
}
