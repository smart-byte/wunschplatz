import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { COMPANY } from '@/lib/company';
import { cn } from '@/lib/utils';

const linkClass =
  'rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export function LegalLinks({ className }: { className?: string }) {
  const { t } = useTranslation('app');
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[12px] text-quiet',
        className,
      )}
    >
      <span>
        © {new Date().getFullYear()} {COMPANY.name}
      </span>
      <span className="flex gap-5">
        <Link to="/impressum" className={linkClass}>
          {t('legal.impressum')}
        </Link>
        <Link to="/datenschutz" className={linkClass}>
          {t('legal.privacy')}
        </Link>
      </span>
    </div>
  );
}
