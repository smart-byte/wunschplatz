import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';

export function HeroSection() {
  const { t } = useTranslation('landing');

  return (
    <section className="mx-auto max-w-[720px] px-6 pb-5 pt-14 sm:px-11 sm:pt-[60px]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mark">
        {t('hero.kicker')}
      </p>

      <h1 className="mt-5 max-w-[15ch] font-serif text-[34px]/[1.1] font-medium tracking-[-0.02em] sm:text-[46px]/[1.1]">
        {t('hero.title')}
      </h1>

      <div className="my-[30px] h-px bg-rule" />

      <p className="text-[18px]/[1.65] text-prose">
        <Trans
          t={t}
          i18nKey="hero.lede"
          components={{ b: <b className="font-semibold text-foreground" /> }}
        />
      </p>

      <div className="mt-7 flex flex-wrap items-baseline gap-x-[18px] gap-y-2">
        <Link
          to="/projects"
          className="border-b-2 border-mark-soft pb-0.5 text-[16px] font-semibold text-mark transition-colors hover:border-mark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {t('hero.cta')}
          <span aria-hidden> →</span>
        </Link>
        <span className="text-[13px] text-quiet">{t('hero.ctaHint')}</span>
      </div>
    </section>
  );
}
