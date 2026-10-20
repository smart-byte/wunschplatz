import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { GITHUB_URL } from './constants';

const facts = ['local', 'account', 'rounds', 'openSource'] as const;

export function FactsSection() {
  const { t } = useTranslation('landing');

  return (
    <section className="mx-auto max-w-[720px] px-6 pt-11 sm:px-11">
      <h2 className="sr-only">{t('facts.title')}</h2>

      <ul className="grid gap-px border border-rule bg-rule sm:grid-cols-2">
        {facts.map((key) => (
          <li
            key={key}
            className="grid grid-cols-[18px_1fr] content-start gap-x-2.5 gap-y-0.5 bg-white px-[18px] py-4"
          >
            <span aria-hidden className="row-span-2 text-[13px] text-mark-2">
              ✓
            </span>
            <h3 className="font-serif text-[15.5px] font-medium">{t(`facts.${key}Title`)}</h3>
            <p className="text-[13px]/[1.5] text-prose-soft">
              {t(`facts.${key}Text`)}
              {key === 'account' && (
                <>
                  {' '}
                  <Link
                    to="/datenschutz"
                    className="whitespace-nowrap font-semibold text-mark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {t('facts.privacy')}
                    <span aria-hidden> →</span>
                  </Link>
                </>
              )}
              {key === 'openSource' && (
                <>
                  {' '}
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="whitespace-nowrap font-semibold text-mark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {t('facts.github')}
                    <span aria-hidden> →</span>
                  </a>
                </>
              )}
            </p>
          </li>
        ))}
      </ul>

      <p className="mx-0.5 mt-2.5 text-[12px] text-quiet">{t('facts.note')}</p>
    </section>
  );
}
