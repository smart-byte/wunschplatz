import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { Ellipsis, Plus, Pencil, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { DistributionInfoPopover } from './DistributionInfoPopover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function DistributionSelector() {
  const { t } = useTranslation('app');
  const navigate = useNavigate();
  const distributions = useAssignmentsStore((s) => s.distributions);
  const activeId = useAssignmentsStore((s) => s.activeId);
  const setActive = useAssignmentsStore((s) => s.setActive);
  const renameDistribution = useAssignmentsStore((s) => s.renameDistribution);
  const duplicateDistribution = useAssignmentsStore((s) => s.duplicateDistribution);
  const removeDistribution = useAssignmentsStore((s) => s.removeDistribution);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [nameInput, setNameInput] = useState('');
  const selected = distributions.find((distribution) => distribution.id === activeId);

  function startRename(id: string, currentName: string) {
    setRenameTarget({ id, name: currentName });
    setNameInput(currentName);
    setRenameOpen(true);
  }

  function commitRename() {
    if (!renameTarget) return;
    renameDistribution(renameTarget.id, nameInput);
    setRenameOpen(false);
    setRenameTarget(null);
    toast.success(t('distribution.selector.renamed'));
  }

  if (distributions.length === 0) {
    return (
      <div className="border-l-2 border-mark bg-mark/[0.04] p-5 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{t('distribution.selector.emptyHint')}</p>
        <Button onClick={() => navigate('/optimize')}>
          <Plus className="size-4 mr-2" />
          {t('distribution.selector.startOptimization')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <Label htmlFor="distribution-select" className="w-full text-prose-soft sm:w-auto">
            {t('distribution.selector.label')}
          </Label>
          <Select value={activeId ?? ''} onValueChange={setActive}>
            <SelectTrigger
              id="distribution-select"
              aria-label={t('distribution.selector.label')}
              className="w-48 sm:w-64 bg-white"
            >
              <SelectValue placeholder={t('distribution.selector.choose')} />
            </SelectTrigger>
            <SelectContent>
              {distributions.map((distribution) => (
                <SelectItem key={distribution.id} value={distribution.id}>
                  {distribution.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selected && (
            <>
              <DistributionInfoPopover distribution={selected} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('distribution.selector.actionsTitle')}
                  >
                    <Ellipsis />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => startRename(selected.id, selected.name)}>
                    <Pencil className="size-4 mr-2" />
                    {t('distribution.selector.rename')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const id = duplicateDistribution(
                        selected.id,
                        t('distribution.selector.duplicateName', { name: selected.name }),
                      );
                      if (id) toast.success(t('distribution.selector.duplicated'));
                    }}
                  >
                    <Copy className="size-4 mr-2" />
                    {t('distribution.selector.duplicate')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      if (
                        confirm(t('distribution.selector.confirmDelete', { name: selected.name }))
                      ) {
                        removeDistribution(selected.id);
                        toast.success(t('distribution.selector.deleted'));
                      }
                    }}
                  >
                    <Trash2 className="size-4 mr-2" />
                    {t('common.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
        <Button variant="ghost" className="text-mark" onClick={() => navigate('/optimize')}>
          <Plus />
          {t('distribution.selector.newDistribution')}
        </Button>
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('distribution.selector.renameDialogTitle')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="dist-name">{t('distribution.selector.nameLabel')}</Label>
            <Input
              id="dist-name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={commitRename}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
