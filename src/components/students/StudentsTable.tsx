import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useProjectsStore } from '@/store/useProjectsStore';
import { StudentFormDialog } from './StudentFormDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  MoreHorizontal,
  Pencil,
  Pipette,
  Search,
  Trash2,
  Users,
  UserMinus,
} from 'lucide-react';
import { toast } from 'sonner';
import { getGroupColor, PALETTE, isHex } from '@/lib/groups';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { filterStudents, type StudentFilter } from '@/lib/studentSearch';
import type { Student } from '@/types';
import { cn } from '@/lib/utils';

type SortKey =
  'name' | 'className' | 'grade' | 'group' | 'prio1' | 'prio2' | 'prio3' | 'prio4' | 'prio5';
type SortDir = 'asc' | 'desc';

// ponytail: plain paging instead of virtualization; rows render in steps of 100.
const PAGE_SIZE = 100;

function sortValue(s: Student, key: SortKey, projectName: (id: string) => string): string | number {
  switch (key) {
    case 'name':
      return `${s.lastName} ${s.firstName}`;
    case 'className':
      return s.className;
    case 'grade':
      return s.grade;
    case 'group':
      return s.groupId ?? '';
    case 'prio1':
      return s.priorities[0] ? projectName(s.priorities[0]) : '';
    case 'prio2':
      return s.priorities[1] ? projectName(s.priorities[1]) : '';
    case 'prio3':
      return s.priorities[2] ? projectName(s.priorities[2]) : '';
    case 'prio4':
      return s.priorities[3] ? projectName(s.priorities[3]) : '';
    case 'prio5':
      return s.priorities[4] ? projectName(s.priorities[4]) : '';
  }
}

export function StudentsTable() {
  const { t, i18n } = useTranslation('app');
  const students = useStudentsStore((s) => s.students);
  const groupColors = useStudentsStore((s) => s.groupColors);
  const updateStudent = useStudentsStore((s) => s.updateStudent);
  const removeStudent = useStudentsStore((s) => s.removeStudent);
  const createGroup = useStudentsStore((s) => s.createGroup);
  const removeFromGroup = useStudentsStore((s) => s.removeFromGroup);
  const setGroupColor = useStudentsStore((s) => s.setGroupColor);
  const projects = useProjectsStore((s) => s.projects);
  const projectNames = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects],
  );
  const projectName = useCallback((id: string) => projectNames.get(id) ?? '?', [projectNames]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  // One shared dialog and one action variant per row keep large classes cheap to render.
  // `editing` outlives `editOpen` so the closing dialog keeps its title and content.
  const [editing, setEditing] = useState<Student | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const wide = useMediaQuery('(min-width: 1280px)');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StudentFilter>('all');
  const [visible, setVisible] = useState(PAGE_SIZE);

  function handleSort(key: SortKey) {
    setVisible(PAGE_SIZE);
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sortedStudents = useMemo(() => {
    const collator = new Intl.Collator(i18n.resolvedLanguage ?? i18n.language, {
      sensitivity: 'base',
      numeric: true,
    });
    const copy = [...students];
    copy.sort((a, b) => {
      const va = sortValue(a, sortKey, projectName);
      const vb = sortValue(b, sortKey, projectName);
      let cmp: number;
      if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb;
      } else {
        cmp = collator.compare(String(va), String(vb));
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [students, sortKey, sortDir, projectName, i18n.resolvedLanguage, i18n.language]);
  const shownStudents = useMemo(
    () => filterStudents(sortedStudents, query, filter),
    [sortedStudents, query, filter],
  );

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
    const ids = selectedStudents.map((s) => s.id);
    const result = createGroup(ids, templateId);
    if (!result.ok) {
      toast.error(t(`students.groupErrors.${result.error}`));
      return;
    }
    clearSelection();
    setTemplateDialogOpen(false);
    setTemplateChoice(null);
    toast.success(t('students.groupFormed', { count: ids.length }));
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

  const selectedStudents = students.filter((s) => selected.has(s.id));
  const canForm = (() => {
    if (selectedStudents.length < 2) return null;
    if (selectedStudents.some((s) => s.groupId)) return t('students.alreadyInGroup');
    return 'ok';
  })();

  if (students.length === 0) {
    return <p className="text-muted-foreground">{t('students.emptyHint')}</p>;
  }

  const hint = (() => {
    if (canForm && canForm !== 'ok') return canForm;
    if (canForm === null && selectedStudents.length === 1) return t('students.hintAtLeastTwo');
    return null;
  })();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-3 size-4 text-prose-soft"
          />
          <Input
            type="search"
            aria-label={t('students.search.label')}
            placeholder={t('students.search.placeholder')}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisible(PAGE_SIZE);
            }}
            className="bg-white pl-9"
          />
        </div>
        <Select
          value={filter}
          onValueChange={(value) => {
            setFilter(value as StudentFilter);
            setVisible(PAGE_SIZE);
          }}
        >
          <SelectTrigger aria-label={t('students.filter.label')} className="w-48 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('students.filter.all')}</SelectItem>
            <SelectItem value="noWishes">{t('students.filter.noWishes')}</SelectItem>
            <SelectItem value="grouped">{t('students.filter.grouped')}</SelectItem>
          </SelectContent>
        </Select>
        {selectedStudents.length === 0 && (
          <span className="text-xs text-prose-soft">{t('students.hintMinTwo')}</span>
        )}
        <span aria-live="polite" className="ml-auto text-xs tabular-nums text-prose-soft">
          {shownStudents.length} / {students.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <Table className="[&_td]:py-2.5">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <SortHead
                label={t('students.table.name')}
                col="name"
                sortKey={sortKey}
                sortDir={sortDir}
                onClick={handleSort}
              />
              <SortHead
                label={t('students.table.class')}
                col="className"
                sortKey={sortKey}
                sortDir={sortDir}
                onClick={handleSort}
              />
              <SortHead
                label={t('students.table.grade')}
                col="grade"
                sortKey={sortKey}
                sortDir={sortDir}
                onClick={handleSort}
              />
              <SortHead
                label={t('students.table.group')}
                col="group"
                sortKey={sortKey}
                sortDir={sortDir}
                onClick={handleSort}
              />
              <SortHead
                label={t('students.prioLabel', { n: 1 })}
                col="prio1"
                sortKey={sortKey}
                sortDir={sortDir}
                onClick={handleSort}
              />
              <SortHead
                label={t('students.prioLabel', { n: 2 })}
                col="prio2"
                sortKey={sortKey}
                sortDir={sortDir}
                onClick={handleSort}
              />
              <SortHead
                label={t('students.prioLabel', { n: 3 })}
                col="prio3"
                sortKey={sortKey}
                sortDir={sortDir}
                onClick={handleSort}
              />
              <SortHead
                label={t('students.prioLabel', { n: 4 })}
                col="prio4"
                sortKey={sortKey}
                sortDir={sortDir}
                onClick={handleSort}
              />
              <SortHead
                label={t('students.prioLabel', { n: 5 })}
                col="prio5"
                sortKey={sortKey}
                sortDir={sortDir}
                onClick={handleSort}
              />
              <TableHead className="sticky right-0 bg-background w-[60px] xl:w-[140px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shownStudents.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="py-12 text-center text-prose-soft">
                  {t('students.noResults')}
                </TableCell>
              </TableRow>
            )}
            {shownStudents.slice(0, visible).map((s) => {
              const color = s.groupId ? getGroupColor(s.groupId, groupColors) : null;
              const rowStyle =
                color?.kind === 'custom'
                  ? ({
                      borderLeftColor: color.hex,
                      ['--row-bg' as string]: color.hex + '14',
                      ['--row-bg-h' as string]: color.hex + '2e',
                      ['--btn-hover' as string]: color.hex + '4d',
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
                      aria-label={t('students.selectNamed', {
                        name: `${s.firstName} ${s.lastName}`,
                      })}
                      checked={selected.has(s.id)}
                      onCheckedChange={() => toggle(s.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {s.lastName}, {s.firstName}
                  </TableCell>
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
                    <TableCell key={i} className="text-sm max-w-[160px] align-top">
                      {s.priorities[i] ? (
                        <span className="block break-words leading-tight">
                          {projectName(s.priorities[i])}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="sticky right-0 z-10 bg-inherit w-[60px] xl:w-[140px]">
                    <StudentRowActions
                      student={s}
                      wide={wide}
                      actionBtnClass={actionBtnClass}
                      onEdit={() => {
                        setEditing(s);
                        setEditOpen(true);
                      }}
                      onRemoveFromGroup={() => {
                        removeFromGroup(s.id);
                        toast.success(t('students.removedFromGroup'));
                      }}
                      onDelete={() => {
                        if (
                          confirm(
                            t('students.confirmDelete', { name: `${s.firstName} ${s.lastName}` }),
                          )
                        ) {
                          removeStudent(s.id);
                          toast.success(t('students.deleted'));
                        }
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {shownStudents.length > visible && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setVisible((count) => count + PAGE_SIZE)}>
            {t('students.showMore', {
              count: Math.min(PAGE_SIZE, shownStudents.length - visible),
            })}
          </Button>
        </div>
      )}
      {selectedStudents.length > 0 && (
        <div
          role="region"
          aria-label={t('students.selectionLabel')}
          className="sticky bottom-4 z-20 mx-auto flex w-fit max-w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-rule bg-white px-4 py-2 shadow-lg"
        >
          <span className="text-sm font-medium">
            {t('students.selectedCount', { count: selectedStudents.length })}
          </span>
          <span className="max-w-md truncate text-xs text-prose-soft">
            {selectedStudents
              .slice(0, 3)
              .map((st) => `${st.lastName}, ${st.firstName}`)
              .join(' · ')}
            {selectedStudents.length > 3 &&
              ` ${t('students.selectionMore', { count: selectedStudents.length - 3 })}`}
          </span>
          <Button size="sm" disabled={canForm !== 'ok'} onClick={handleCreateGroup}>
            <Users />
            {t('students.formGroup')}
          </Button>
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
          <Button size="sm" variant="ghost" onClick={clearSelection}>
            {t('students.clearSelection')}
          </Button>
        </div>
      )}

      <StudentFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={editing ?? undefined}
        onSave={(data) => {
          if (!editing) return;
          updateStudent(editing.id, data);
          toast.success(editing.groupId ? t('students.updatedWithGroup') : t('students.updated'));
        }}
      />

      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('students.templateDialog.title')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('students.templateDialog.description')}
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
                    {s.lastName}, {s.firstName}{' '}
                    <span className="text-muted-foreground font-normal">
                      {t('students.templateDialog.classGrade', {
                        className: s.className,
                        grade: s.grade,
                      })}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {s.priorities.length === 0
                      ? t('students.templateDialog.noPrios')
                      : s.priorities.map((id, i) => `${i + 1}. ${projectName(id)}`).join(' · ')}
                  </div>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={!templateChoice}
              onClick={() => templateChoice && commitGroup(templateChoice)}
            >
              {t('students.formGroup')}
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
  const { t } = useTranslation('app');
  const colorLabel = color.kind === 'custom' ? color.label : t(`students.colors.${color.key}`);
  const badgeStyle =
    color.kind === 'custom' ? { backgroundColor: color.hex + '33', color: color.hex } : undefined;
  const badgeClass = color.kind === 'palette' ? cn(color.bgClass, color.textClass) : '';
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
          title={t('students.colorChange')}
        >
          <Users className="size-3" />
          {colorLabel}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="text-xs text-muted-foreground mb-2 px-1">
          {t('students.pickGroupColor')}
        </div>
        <div className="grid grid-cols-8 gap-1">
          {PALETTE.map((c) => {
            const active = currentKey === c.key;
            const taken = !active && usedByOthers.has(c.key);
            const label = t(`students.colors.${c.key}`);
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
                title={taken ? t('students.colorTaken', { label }) : label}
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
            {t('students.customColor')}
          </label>
          <input
            type="color"
            aria-label={t('students.customColor')}
            value={isHex(currentKey) ? currentKey : '#888888'}
            onChange={(e) => onPick(e.target.value)}
            className="h-7 w-12 cursor-pointer border rounded"
          />
          {isHex(currentKey) && (
            <span className="text-xs font-mono text-muted-foreground">
              {currentKey.toUpperCase()}
            </span>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

type StudentRowActionsProps = {
  student: Student;
  wide: boolean;
  actionBtnClass: string;
  onEdit: () => void;
  onRemoveFromGroup: () => void;
  onDelete: () => void;
};

function StudentRowActions({
  student,
  wide,
  actionBtnClass,
  onEdit,
  onRemoveFromGroup,
  onDelete,
}: StudentRowActionsProps) {
  const { t } = useTranslation('app');
  if (wide) {
    return (
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={actionBtnClass}
          title={t('common.edit')}
          aria-label={t('common.editNamed', { name: `${student.firstName} ${student.lastName}` })}
          onClick={onEdit}
        >
          <Pencil className="size-4" />
        </Button>
        {student.groupId && (
          <Button
            variant="ghost"
            size="icon"
            className={actionBtnClass}
            title={t('students.removeFromGroup')}
            onClick={onRemoveFromGroup}
          >
            <UserMinus className="size-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={actionBtnClass}
          title={t('common.delete')}
          aria-label={t('common.deleteNamed', { name: `${student.firstName} ${student.lastName}` })}
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" title={t('students.actions')}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="size-4 mr-2" /> {t('common.edit')}
        </DropdownMenuItem>
        {student.groupId && (
          <DropdownMenuItem onClick={onRemoveFromGroup}>
            <UserMinus className="size-4 mr-2" /> {t('students.removeFromGroup')}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="size-4 mr-2" /> {t('common.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
