import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { LegalLinks } from '@/components/legal/LegalLinks';

export function LandingFooter() {
  const { t } = useTranslation('landing');

  return (
    <footer className="mx-auto max-w-[720px] px-6 pb-[46px] pt-11 sm:px-11">
      <div className="relative flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-[8px] bg-mark-ink px-8 py-[30px] text-white">
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-mark to-mark-2"
        />
        <div>
          <h2 className="font-serif text-[24px] font-medium leading-[1.3] tracking-[-0.01em] sm:leading-normal">
            {t('footer.ctaTitle')}
          </h2>
          <p className="mt-1 text-[13px] text-white/70">{t('footer.ctaHint')}</p>
        </div>
        <Button
          asChild
          className="h-auto gap-1.5 rounded-lg bg-white px-5 py-[11px] text-[15px] font-semibold text-mark-ink hover:bg-white/90 focus-visible:ring-offset-mark-ink"
        >
          <Link to="/projects">
            {t('footer.cta')}
            <span aria-hidden>→</span>
          </Link>
        </Button>
      </div>
      <LegalLinks className="mt-6 px-0.5" />
    </footer>
  );
}
