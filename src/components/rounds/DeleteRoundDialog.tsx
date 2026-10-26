import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deleteRound } from '@/store/roundsTransaction';
import { useRoundsStore } from '@/store/useRoundsStore';
import type { Round } from '@/types';

type Props = { round: Pick<Round, 'id' | 'name'>; onClose: () => void };

export function DeleteRoundDialog({ round, onClose }: Props) {
  const { t } = useTranslation('app');
  const isLast = useRoundsStore((s) => s.rounds.length === 1);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const word = t('rounds.deleteWord');
  const confirmed = typed.trim().toLowerCase() === word.toLowerCase();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (deleting || !confirmed) return;
    setDeleting(true);
    setError('');
    try {
      await deleteRound(round.id, t('rounds.defaultName', { n: 1 }), new Date().toISOString());
      toast.success(t('rounds.deleted'));
      onClose();
    } catch {
      setError(t('rounds.deleteFailed'));
      setDeleting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !deleting && onClose()}>
      <DialogContent>
        <form onSubmit={submit} noValidate className="space-y-5">
          <DialogHeader>
            <DialogTitle>{t('rounds.deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('rounds.confirmDelete', { name: round.name })}
              {isLast && ` ${t('rounds.deleteLast')}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="round-delete-word">{t('rounds.deleteWordLabel', { word })}</Label>
            <Input
              id="round-delete-word"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              disabled={deleting}
              aria-invalid={!!error}
              aria-describedby={error ? 'round-delete-error' : undefined}
            />
            {error && (
              <p id="round-delete-error" role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={deleting} onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="destructive" disabled={deleting || !confirmed}>
              {t('rounds.delete')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
