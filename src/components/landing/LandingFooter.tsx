import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function LandingFooter() {
  const { t } = useTranslation('landing');

  return (
    <footer className="mx-auto mt-10 max-w-[720px] px-6 pb-[46px] sm:px-11">
      <div className="flex flex-wrap items-baseline justify-between gap-5 border-t border-rule pt-[26px]">
        <h2 className="font-serif text-[22px] font-medium tracking-[-0.01em]">
          {t('footer.ctaTitle')}
        </h2>
        <Link
          to="/projects"
          className="border-b-2 border-mark-soft pb-0.5 text-[16px] font-semibold text-mark transition-colors hover:border-mark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {t('footer.cta')}
          <span aria-hidden> →</span>
        </Link>
      </div>
    </footer>
  );
}
