import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  const { t } = useTranslation('landing');

  return (
    <section className="mx-auto max-w-[720px] px-6 pb-2 pt-14 sm:px-11 sm:pt-[60px]">
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

      <div className="mt-7 flex flex-wrap items-center gap-x-[18px] gap-y-3">
        <Button
          asChild
          className="h-auto gap-1.5 rounded-lg px-5 py-[11px] text-[15px] font-semibold shadow-[0_1px_2px_rgba(38,48,110,0.25)]"
        >
          <Link to="/projects">
            {t('hero.cta')}
            <span aria-hidden>→</span>
          </Link>
        </Button>
        <span className="text-[13px] text-quiet">{t('hero.ctaHint')}</span>
      </div>
    </section>
  );
}
