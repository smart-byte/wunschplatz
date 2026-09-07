import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LanguageToggle } from '@/components/LanguageToggle';
import { BrandIcon } from '@/components/BrandIcon';
import { GITHUB_URL } from './constants';

export function LandingHeader() {
  const { t } = useTranslation('landing');
  return (
    <header className="landing-header border-b border-rule bg-paper/80">
      <div className="flex items-center justify-between gap-4 px-6 py-[18px] sm:px-11">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <BrandIcon className="size-[30px]" />
          <span className="truncate text-[15px] font-semibold tracking-tight">Wunschplatz</span>
        </Link>

        <div className="flex shrink-0 items-center gap-4 sm:gap-[18px]">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="text-[13px] text-quiet transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {t('header.github')}
          </a>
          <LanguageToggle quiet />
        </div>
      </div>
    </header>
  );
}
