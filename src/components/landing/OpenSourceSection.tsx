import { useTranslation } from 'react-i18next';
import { GITHUB_URL } from './constants';

export function OpenSourceSection() {
  const { t } = useTranslation('landing');

  return (
    <section className="mx-auto max-w-[720px] px-6 pt-11 sm:px-11">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mark">
        {t('openSource.kicker')}
      </h2>
      <div className="border-t border-rule pt-[18px]">
        <p className="text-[14.5px]/[1.6] text-prose-soft">{t('openSource.text')}</p>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-2.5 inline-block border-b-2 border-mark-soft pb-0.5 text-[14px] font-semibold text-mark transition-colors hover:border-mark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {t('openSource.cta')}
          <span aria-hidden> →</span>
        </a>
      </div>
    </section>
  );
}
