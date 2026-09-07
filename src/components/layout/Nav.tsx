import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Layers, Settings2 } from 'lucide-react';
import { useRoundsStore } from '@/store/useRoundsStore';
import { switchRound } from '@/store/roundsTransaction';
import { LanguageToggle } from '@/components/LanguageToggle';
import { BrandIcon } from '@/components/BrandIcon';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

type Link = { to: string; labelKey: string };

const links: Link[] = [
  { to: '/projects', labelKey: 'nav.projects' },
  { to: '/students', labelKey: 'nav.students' },
  { to: '/optimize', labelKey: 'nav.optimize' },
  { to: '/distribution', labelKey: 'nav.distribution' },
];

function RoundSwitcher() {
  const { t } = useTranslation('app');
  const rounds = useRoundsStore((s) => s.rounds);
  const activeRoundId = useRoundsStore((s) => s.activeRoundId);
  const activeRound = rounds.find((r) => r.id === activeRoundId);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function onSelect(id: string) {
    if (id === activeRoundId) return;
    setBusy(true);
    try {
      await switchRound(id);
      toast.success(t('nav.roundSwitched'));
    } catch {
      toast.error(t('nav.switchFailed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        title={t('nav.selectRound')}
        aria-label={`${t('nav.selectRound')}: ${activeRound?.name ?? t('nav.roundsFallback')}`}
        disabled={busy}
        className="inline-flex min-w-0 items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors text-prose hover:text-mark hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent"
      >
        <Layers className="size-4 shrink-0" />
        <span className="max-w-[7rem] sm:max-w-[12rem] truncate">
          {activeRound?.name ?? t('nav.roundsFallback')}
        </span>
        <ChevronDown className="size-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {rounds.map((r) => (
          <DropdownMenuItem
            key={r.id}
            disabled={busy}
            onSelect={() => onSelect(r.id)}
            className="gap-2"
          >
            <Check
              className={cn(
                'size-4 shrink-0',
                r.id === activeRoundId ? 'opacity-100' : 'opacity-0',
              )}
            />
            <span className="truncate flex-1">{r.name}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {t(`phase.${r.phase ?? 'running'}`)}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/wunschrunden')} className="gap-2">
          <Settings2 className="size-4" />
          {t('nav.manageRounds')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Nav() {
  const { t } = useTranslation('app');
  return (
    <nav
      aria-label={t('nav.mainLabel')}
      className="sticky top-0 z-30 border-b border-rule bg-paper/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-x-3 px-4 sm:px-8 lg:flex-nowrap">
        <NavLink
          to="/"
          aria-label="Wunschplatz"
          className="flex h-16 shrink-0 items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BrandIcon className="size-8" />
          <span className="hidden font-semibold tracking-tight sm:inline">Wunschplatz</span>
        </NavLink>
        <ul className="order-last flex w-full items-stretch justify-between gap-2 sm:justify-start sm:gap-8 lg:order-none lg:ml-10 lg:w-auto lg:flex-1">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-11 items-center whitespace-nowrap border-b-2 px-0.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm lg:min-h-16',
                    isActive
                      ? 'border-mark text-mark font-semibold'
                      : 'border-transparent text-prose-soft hover:text-mark',
                  )
                }
              >
                {t(link.labelKey)}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="ml-auto min-w-0">
          <RoundSwitcher />
        </div>
        <div className="shrink-0 border-l border-rule pl-3 sm:pl-5">
          <LanguageToggle />
        </div>
      </div>
    </nav>
  );
}
