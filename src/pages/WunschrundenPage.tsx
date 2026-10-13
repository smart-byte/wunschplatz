import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { MoreHorizontal } from 'lucide-react';
import { useRoundsStore } from '@/store/useRoundsStore';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useStudentsStore } from '@/store/useStudentsStore';
import {
  createRound,
  setRoundPhase,
  duplicateRound,
  deleteRound,
  switchRound,
} from '@/store/roundsTransaction';
import { PHASES } from '@/lib/roundPhase';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { RenameRoundDialog } from '@/components/rounds/RenameRoundDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { Round, RoundPhase } from '@/types';

export default function WunschrundenPage() {
  const { t } = useTranslation('app');
  const rounds = useRoundsStore((s) => s.rounds);
  const activeRoundId = useRoundsStore((s) => s.activeRoundId);
  const liveProjectCount = useProjectsStore((s) => s.projects.length);
  const liveStudentCount = useStudentsStore((s) => s.students.length);
  const [busy, setBusy] = useState(false);
  const [renaming, setRenaming] = useState<Pick<Round, 'id' | 'name'> | null>(null);

  async function run(action: () => Promise<void>, ok: string, err: string) {
    setBusy(true);
    try {
      await action();
      toast.success(ok);
    } catch {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  }

  function onCreate() {
    const n = rounds.length + 1;
    void run(
      () => createRound(t('rounds.defaultName', { n }), new Date().toISOString()),
      t('rounds.created', { n }),
      t('rounds.createFailed'),
    );
  }

  function onSelect(id: string) {
    if (id === activeRoundId) return;
    void run(() => switchRound(id), t('nav.roundSwitched'), t('nav.switchFailed'));
  }

  function onDuplicate(id: string) {
    void run(
      () =>
        duplicateRound(
          id,
          new Date().toISOString(),
          t('rounds.duplicateName', { name: rounds.find((round) => round.id === id)?.name ?? '' }),
        ),
      t('rounds.duplicated'),
      t('rounds.duplicateFailed'),
    );
  }

  function onDelete(id: string, name: string) {
    if (!confirm(t('rounds.confirmDelete', { name }))) return;
    void run(() => deleteRound(id), t('rounds.deleted'), t('rounds.deleteFailed'));
  }

  return (
    <>
      <PageHeader
        title={t('rounds.title')}
        description={t('rounds.description')}
        actions={
          <Button disabled={busy} onClick={onCreate}>
            {t('rounds.create')}
          </Button>
        }
      />

      <ul className="max-w-screen-lg space-y-2">
        {rounds.map((r) => {
          const isSelected = r.id === activeRoundId;
          const projectCount = isSelected ? liveProjectCount : (r.data?.projects.length ?? 0);
          const studentCount = isSelected ? liveStudentCount : (r.data?.students.length ?? 0);
          return (
            <li
              key={r.id}
              className={cn(
                'flex flex-col items-stretch gap-3 rounded-lg border bg-white p-4 sm:flex-row sm:items-center sm:justify-between',
                isSelected && 'border-primary/40 bg-primary/5',
              )}
            >
              <div className="min-w-0">
                <button
                  type="button"
                  disabled={busy || isSelected}
                  title={isSelected ? undefined : t('rounds.selectTitle')}
                  onClick={() => onSelect(r.id)}
                  className={cn(
                    'font-medium truncate block max-w-full text-left',
                    !isSelected && 'hover:underline',
                  )}
                >
                  {r.name}
                </button>
                <div className="text-xs text-muted-foreground">
                  {t('rounds.counts', { projectCount, studentCount })}
                  {r.blueprint ? t('rounds.formCreated') : ''}
                </div>
              </div>
              <div className="flex items-center justify-between gap-1 shrink-0">
                <Select
                  value={r.phase ?? 'running'}
                  onValueChange={(v) => setRoundPhase(r.id, v as RoundPhase)}
                >
                  <SelectTrigger
                    aria-label={t('rounds.phaseLabel', { name: r.name })}
                    className="w-44"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PHASES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {t(`phase.${p}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t('rounds.actions')}
                      title={t('rounds.actions')}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      disabled={busy}
                      onSelect={() => setRenaming({ id: r.id, name: r.name })}
                    >
                      {t('rounds.rename')}
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={busy} onSelect={() => onDuplicate(r.id)}>
                      {t('rounds.duplicate')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={busy || isSelected}
                      className="text-destructive focus:text-destructive"
                      onSelect={() => onDelete(r.id, r.name)}
                    >
                      {t('rounds.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          );
        })}
      </ul>
      {renaming && <RenameRoundDialog round={renaming} onClose={() => setRenaming(null)} />}
    </>
  );
}
