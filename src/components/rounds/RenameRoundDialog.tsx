import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { renameRound } from '@/store/roundsTransaction';
import { useRoundsStore } from '@/store/useRoundsStore';
import type { Round } from '@/types';

type Props = { round: Pick<Round, 'id' | 'name'>; onClose: () => void };

export function RenameRoundDialog({ round, onClose }: Props) {
  const { t } = useTranslation('app');
  const [name, setName] = useState(round.name);
  const [originalName, setOriginalName] = useState(round.name);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('rounds.nameRequired'));
      return;
    }
    const current = useRoundsStore.getState().rounds.find((item) => item.id === round.id);
    if (!current) {
      setError(t('common.itemDeleted'));
      return;
    }
    if (trimmed === originalName || trimmed === current.name) {
      onClose();
      return;
    }
    if (current.name !== originalName) {
      setOriginalName(current.name);
      setError(t('rounds.renameConflict', { name: current.name }));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await renameRound(round.id, trimmed);
      toast.success(t('rounds.renamed'));
      onClose();
    } catch {
      setError(t('rounds.renameFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent>
        <form onSubmit={submit} noValidate className="space-y-5">
          <DialogHeader>
            <DialogTitle>{t('rounds.renameTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="round-name">{t('rounds.nameLabel')}</Label>
            <Input
              id="round-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onFocus={(event) => event.currentTarget.select()}
              required
              disabled={saving}
              aria-invalid={!!error}
              aria-describedby={error ? 'round-name-error' : undefined}
            />
            {error && (
              <p id="round-name-error" role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
