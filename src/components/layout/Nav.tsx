import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Settings2 } from 'lucide-react';
import { useRoundsStore } from '@/store/useRoundsStore';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useActiveDistribution } from '@/store/useAssignmentsStore';
import { useSessionStore } from '@/store/session';
import { useStaleAssignments } from '@/hooks/useStaleAssignments';
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

type StepState = 'open' | 'done' | 'attention';
type Step = { to: string; labelKey: string; count?: number; state: StepState };

/** The workflow is a sequence; each step shows whether it still needs work. */
function useSteps(): Step[] {
  const projectCount = useProjectsStore((s) => s.projects.length);
  const studentCount = useStudentsStore((s) => s.students.length);
  const hasDistribution = useActiveDistribution() !== null;
  const { stale } = useStaleAssignments();
  return [
    {
      to: '/projects',
      labelKey: 'nav.projects',
      count: projectCount,
      state: projectCount ? 'done' : 'open',
    },
    {
      to: '/students',
      labelKey: 'nav.students',
      count: studentCount,
      state: studentCount ? 'done' : 'open',
    },
    { to: '/optimize', labelKey: 'nav.optimize', state: hasDistribution ? 'done' : 'open' },
    {
      to: '/distribution',
      labelKey: 'nav.distribution',
      state: !hasDistribution ? 'open' : stale ? 'attention' : 'done',
    },
  ];
}

function RoundSwitcher() {
  const { t } = useTranslation('app');
  const rounds = useRoundsStore((s) => s.rounds);
  const activeRoundId = useRoundsStore((s) => s.activeRoundId);
  const ready = useSessionStore((s) => s.phase === 'ready');
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
        disabled={busy || !ready}
        className="inline-flex min-w-0 items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-prose transition-colors hover:bg-accent hover:text-mark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 data-[state=open]:bg-accent"
      >
        <span className="max-w-[9rem] truncate sm:max-w-[14rem]">
          {activeRound?.name ?? t('nav.roundsFallback')}
        </span>
        <ChevronDown className="size-3.5 shrink-0 opacity-60" />
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
  const steps = useSteps();
  return (
    <nav
      aria-label={t('nav.mainLabel')}
      className="sticky top-0 z-30 border-b border-rule bg-paper/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-x-3 px-4 sm:px-8 lg:flex-nowrap">
        {/* Breadcrumb: every page belongs to the selected Wunschrunde. */}
        <div className="flex h-16 min-w-0 items-center gap-1 sm:gap-2">
          <NavLink
            to="/"
            aria-label="Wunschplatz"
            className="flex shrink-0 items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <BrandIcon className="size-8" />
            <span className="hidden font-semibold tracking-tight sm:inline">Wunschplatz</span>
          </NavLink>
          <span aria-hidden className="text-lg font-light text-quiet/60">
            /
          </span>
          <RoundSwitcher />
        </div>
        <ol className="order-last flex w-full items-stretch justify-between gap-2 sm:justify-start sm:gap-6 lg:order-none lg:ml-8 lg:w-auto lg:flex-1 xl:gap-8">
          {steps.map((step, index) => (
            <li key={step.to}>
              <NavLink
                to={step.to}
                data-state={step.state}
                aria-describedby={`nav-step-state-${index}`}
                title={step.state === 'attention' ? t('nav.outdated') : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-11 items-center gap-2 whitespace-nowrap border-b-2 px-0.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm lg:min-h-16',
                    isActive
                      ? 'border-mark text-mark font-semibold'
                      : 'border-transparent text-prose-soft hover:text-mark',
                  )
                }
              >
                <span
                  aria-hidden
                  className={cn(
                    'hidden size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-medium tabular-nums sm:inline-flex',
                    step.state === 'done' && 'bg-mark text-white',
                    step.state === 'attention' &&
                      'bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-400',
                    step.state === 'open' && 'border border-rule text-prose-soft',
                  )}
                >
                  {index + 1}
                </span>
                {t(step.labelKey)}
                {step.state === 'attention' && (
                  <span aria-hidden className="size-1.5 rounded-full bg-amber-500 sm:hidden" />
                )}
                {step.count ? (
                  <span
                    aria-hidden
                    className="hidden text-xs font-normal tabular-nums text-prose-soft xl:inline"
                  >
                    {step.count}
                  </span>
                ) : null}
              </NavLink>
              {/* The step state, for screen readers; colour alone carries it visually. */}
              <span id={`nav-step-state-${index}`} hidden>
                {step.state === 'attention' ? t('nav.outdated') : t(`nav.state.${step.state}`)}
              </span>
            </li>
          ))}
        </ol>
        <div className="ml-auto shrink-0 pl-3 lg:pl-6">
          <LanguageToggle quiet />
        </div>
      </div>
    </nav>
  );
}
