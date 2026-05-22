import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useProjectsStore } from '@/store/useProjectsStore';
import { StudentFormDialog } from './StudentFormDialog';
import { ArrowDown, ArrowUp, ArrowUpDown, Check, Pencil, Pipette, Trash2, Users, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { getGroupColor, PALETTE, isHex } from '@/lib/groups';
import type { Student } from '@/types';
import { cn } from '@/lib/utils';

type SortKey = 'name' | 'className' | 'grade' | 'group' | 'prio1' | 'prio2' | 'prio3' | 'prio4' | 'prio5';
type SortDir = 'asc' | 'desc';

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, 'de', { sensitivity: 'base', numeric: true });
}

function sortValue(s: Student, key: SortKey, projectName: (id: string) => string): string | number {
  switch (key) {
    case 'name': return `${s.lastName} ${s.firstName}`;
    case 'className': return s.className;
    case 'grade': return s.grade;
    case 'group': return s.groupId ?? '';
    case 'prio1': return s.priorities[0] ? projectName(s.priorities[0]) : '';
    case 'prio2': return s.priorities[1] ? projectName(s.priorities[1]) : '';
    case 'prio3': return s.priorities[2] ? projectName(s.priorities[2]) : '';
    case 'prio4': return s.priorities[3] ? projectName(s.priorities[3]) : '';
    case 'prio5': return s.priorities[4] ? projectName(s.priorities[4]) : '';
  }
}

export function StudentsTable() {
  const students = useStudentsStore((s) => s.students);
  const groupColors = useStudentsStore((s) => s.groupColors);
  const updateStudent = useStudentsStore((s) => s.updateStudent);
  const removeStudent = useStudentsStore((s) => s.removeStudent);
  const createGroup = useStudentsStore((s) => s.createGroup);
  const removeFromGroup = useStudentsStore((s) => s.removeFromGroup);
  const setGroupColor = useStudentsStore((s) => s.setGroupColor);
  const projects = useProjectsStore((s) => s.projects);
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? '?';

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sortedStudents = useMemo(() => {
    const copy = [...students];
    copy.sort((a, b) => {
      const va = sortValue(a, sortKey, projectName);
      const vb = sortValue(b, sortKey, projectName);
      let cmp: number;
      if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb;
      } else {
        cmp = compareStrings(String(va), String(vb));
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
    // projectName depends on `projects` already in deps via students reference; include explicitly:
  }, [students, sortKey, sortDir, projects]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function clearSelection() {
    setSelected(new Set());
  }

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateChoice, setTemplateChoice] = useState<string | null>(null);

  function priosEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((v, i) => v === b[i]);
  }

  function commitGroup(templateId?: string) {
    const ids = [...selected];
    const result = createGroup(ids, templateId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    clearSelection();
    setTemplateDialogOpen(false);
    setTemplateChoice(null);
    toast.success(`Gruppe mit ${ids.length} Schülern gebildet`);
  }

  function handleCreateGroup() {
    const selStudents = students.filter((s) => selected.has(s.id));
    if (selStudents.length < 2) return;
    const firstPrios = selStudents[0].priorities;
    const allSame = selStudents.every((s) => priosEqual(s.priorities, firstPrios));
    if (allSame) {
      commitGroup();
    } else {
      setTemplateChoice(selStudents[0].id);
      setTemplateDialogOpen(true);
    }
  }

  // Pre-validate the "Gruppe bilden" button state
  const selectedStudents = students.filter((s) => selected.has(s.id));
  const canForm = (() => {
    if (selectedStudents.length < 2) return null;
    if (selectedStudents.some((s) => s.groupId)) return 'Schüler bereits in Gruppe';
    return 'ok';
  })();

  if (students.length === 0) {
    return <p className="text-muted-foreground">Noch keine Schüler. Importiere Excel-Datei oder lege einen neuen Schüler an.</p>;
  }

  const hint = (() => {
    if (selected.size === 0) return 'Mind. 2 Schüler ankreuzen, um eine Gruppe zu bilden';
    if (canForm && canForm !== 'ok') return canForm;
    if (canForm === null && selectedStudents.length === 1) return 'Mindestens 2 Schüler ankreuzen';
    return null;
  })();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 border rounded-lg p-3 bg-card">
        <span className="text-sm">
          {selected.size === 0 ? 'Keine Auswahl' : `${selected.size} ausgewählt`}
        </span>
        <Button
          size="sm"
          disabled={canForm !== 'ok'}
          onClick={handleCreateGroup}
        >
          <Users className="size-4 mr-2" />
          Gruppe bilden
        </Button>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        {selected.size > 0 && (
          <Button size="sm" variant="ghost" className="ml-auto" onClick={clearSelection}>
            Auswahl löschen
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <SortHead label="Name" col="name" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
              <SortHead label="Klasse" col="className" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
              <SortHead label="Jg." col="grade" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
              <SortHead label="Gruppe" col="group" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
              <SortHead label="Prio 1" col="prio1" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
              <SortHead label="Prio 2" col="prio2" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
              <SortHead label="Prio 3" col="prio3" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
              <SortHead label="Prio 4" col="prio4" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
              <SortHead label="Prio 5" col="prio5" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStudents.map((s) => {
              const color = s.groupId ? getGroupColor(s.groupId, groupColors) : null;
              const rowStyle =
                color?.kind === 'custom'
                  ? ({
                      borderLeftColor: color.hex,
                      ['--row-bg' as string]: color.hex + '14', // ~8%
                      ['--row-bg-h' as string]: color.hex + '2e', // ~18%
                      ['--btn-hover' as string]: color.hex + '4d', // ~30%
                    } as React.CSSProperties)
                  : undefined;
              const actionBtnClass =
                color?.kind === 'palette'
                  ? color.actionHoverClass
                  : color?.kind === 'custom'
                    ? 'hover:!bg-[var(--btn-hover)]'
                    : '';
              return (
                <TableRow
                  key={s.id}
                  className={cn(
                    color && 'border-l-4',
                    color?.kind === 'palette' && color.borderClass,
                    color?.kind === 'palette' && color.rowBgClass,
                    color?.kind === 'palette' && color.rowBgHoverClass,
                    color?.kind === 'custom' && '!bg-[var(--row-bg)] hover:!bg-[var(--row-bg-h)]',
                  )}
                  style={rowStyle}
                >
                  <TableCell>
                    <Checkbox
                      checked={selected.has(s.id)}
                      onCheckedChange={() => toggle(s.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{s.lastName}, {s.firstName}</TableCell>
                  <TableCell>{s.className}</TableCell>
                  <TableCell>{s.grade}</TableCell>
                  <TableCell>
                    {s.groupId && color ? (
                      <GroupColorBadge
                        groupId={s.groupId}
                        currentKey={groupColors[s.groupId] ?? color.key}
                        color={color}
                        usedByOthers={
                          new Set(
                            Object.entries(groupColors)
                              .filter(([gid]) => gid !== s.groupId)
                              .map(([, key]) => key),
                          )
                        }
                        onPick={(k) => setGroupColor(s.groupId!, k)}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <TableCell key={i} className="text-sm">
                      {s.priorities[i] ? projectName(s.priorities[i]) : '—'}
                    </TableCell>
                  ))}
                  <TableCell className="flex gap-1">
                    <StudentFormDialog
                      trigger={<Button variant="ghost" size="icon" className={actionBtnClass}><Pencil className="size-4" /></Button>}
                      initial={s}
                      onSave={(data) => {
                        updateStudent(s.id, data);
                        toast.success(s.groupId ? 'Schüler + Gruppe aktualisiert' : 'Schüler aktualisiert');
                      }}
                    />
                    {s.groupId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={actionBtnClass}
                        title="Aus Gruppe entfernen"
                        onClick={() => {
                          removeFromGroup(s.id);
                          toast.success('Aus Gruppe entfernt');
                        }}
                      >
                        <UserMinus className="size-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={actionBtnClass}
                      onClick={() => {
                        if (confirm(`${s.firstName} ${s.lastName} löschen?`)) {
                          removeStudent(s.id);
                          toast.success('Schüler gelöscht');
                        }
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Wessen Prioritäten gelten für die Gruppe?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Die ausgewählten Schüler haben unterschiedliche Prios. Wähle eine Vorlage —
            alle Gruppen-Mitglieder bekommen diese Prios.
          </p>
          <div className="grid gap-2 max-h-[50vh] overflow-y-auto">
            {selectedStudents.map((s) => (
              <label
                key={s.id}
                className={cn(
                  'flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50',
                  templateChoice === s.id && 'border-primary ring-1 ring-primary',
                )}
              >
                <input
                  type="radio"
                  name="template"
                  value={s.id}
                  checked={templateChoice === s.id}
                  onChange={() => setTemplateChoice(s.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">
                    {s.lastName}, {s.firstName} <span className="text-muted-foreground font-normal">({s.className}, Jg. {s.grade})</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {s.priorities.length === 0
                      ? '(keine Prios)'
                      : s.priorities.map((id, i) => `${i + 1}. ${projectName(id)}`).join(' · ')}
                  </div>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>Abbrechen</Button>
            <Button
              disabled={!templateChoice}
              onClick={() => templateChoice && commitGroup(templateChoice)}
            >
              Gruppe bilden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type SortHeadProps = {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onClick: (key: SortKey) => void;
};

function SortHead({ label, col, sortKey, sortDir, onClick }: SortHeadProps) {
  const active = sortKey === col;
  const Icon = !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <TableHead>
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-1 hover:text-foreground',
          active ? 'text-foreground font-medium' : 'text-muted-foreground',
        )}
        onClick={() => onClick(col)}
      >
        {label}
        <Icon className="size-3" />
      </button>
    </TableHead>
  );
}

type GroupColorBadgeProps = {
  groupId: string;
  currentKey: string;
  color: ReturnType<typeof getGroupColor>;
  usedByOthers: Set<string>;
  onPick: (key: string) => void;
};

function GroupColorBadge({ currentKey, color, usedByOthers, onPick }: GroupColorBadgeProps) {
  const badgeStyle =
    color.kind === 'custom'
      ? { backgroundColor: color.hex + '33', color: color.hex }
      : undefined;
  const badgeClass =
    color.kind === 'palette'
      ? cn(color.bgClass, color.textClass)
      : '';
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs hover:opacity-80',
            badgeClass,
          )}
          style={badgeStyle}
          title="Farbe ändern"
        >
          <Users className="size-3" />
          {color.label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="text-xs text-muted-foreground mb-2 px-1">Gruppen-Farbe wählen</div>
        <div className="grid grid-cols-8 gap-1">
          {PALETTE.map((c) => {
            const active = currentKey === c.key;
            const taken = !active && usedByOthers.has(c.key);
            return (
              <button
                key={c.key}
                type="button"
                disabled={taken}
                className={cn(
                  'relative size-7 rounded flex items-center justify-center',
                  c.swatch,
                  active && 'ring-2 ring-offset-2 ring-foreground',
                  taken && 'opacity-25 cursor-not-allowed',
                )}
                title={taken ? `${c.label} — bereits vergeben` : c.label}
                onClick={() => !taken && onPick(c.key)}
              >
                {active && <Check className="size-3.5 text-white drop-shadow" />}
              </button>
            );
          })}
        </div>
        <div className="mt-3 border-t pt-2 flex items-center gap-2">
          <label className="text-xs text-muted-foreground inline-flex items-center gap-1 cursor-pointer">
            <Pipette className="size-3.5" />
            Eigene Farbe
          </label>
          <input
            type="color"
            value={isHex(currentKey) ? currentKey : '#888888'}
            onChange={(e) => onPick(e.target.value)}
            className="h-7 w-12 cursor-pointer border rounded"
          />
          {isHex(currentKey) && (
            <span className="text-xs font-mono text-muted-foreground">{currentKey.toUpperCase()}</span>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
