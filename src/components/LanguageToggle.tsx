import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const LANGS = ['de', 'en'] as const;

export function LanguageToggle({ quiet = false }: { quiet?: boolean }) {
  const { t, i18n } = useTranslation('app');
  const current = i18n.resolvedLanguage;
  return (
    <div
      className={cn(
        'inline-flex text-sm',
        quiet ? 'items-center gap-1.5 text-[13px]' : 'overflow-hidden rounded-md border',
      )}
      role="group"
      aria-label={t('common.languageSelector')}
    >
      {LANGS.map((l, i) => (
        <Fragment key={l}>
          {quiet && i > 0 && (
            <span aria-hidden className="text-quiet/60">
              /
            </span>
          )}
          <button
            type="button"
            onClick={() => void i18n.changeLanguage(l)}
            aria-pressed={current === l}
            className={cn(
              'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
              quiet
                ? current === l
                  ? 'font-semibold text-foreground'
                  : 'text-quiet hover:text-foreground'
                : cn(
                    'px-2.5 py-1',
                    current === l
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted',
                  ),
            )}
          >
            {l.toUpperCase()}
          </button>
        </Fragment>
      ))}
    </div>
  );
}
