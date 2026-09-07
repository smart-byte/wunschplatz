import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useDistributionData } from '@/hooks/useDistributionData';
import { useManualAssignment } from '@/hooks/useManualAssignment';
import { useStudentsStore } from '@/store/useStudentsStore';
import { toast } from 'sonner';
import { AssignmentBadge } from './AssignmentBadge';
import { Badge } from '@/components/ui/badge';
import { StudentFormDialog } from '@/components/students/StudentFormDialog';
import type { Student } from '@/types';

export function TableView() {
  const { t } = useTranslation('app');
  const { rows, projects } = useDistributionData();
  const move = useManualAssignment(rows, projects);
  const updateStudent = useStudentsStore((s) => s.updateStudent);
  const [filter, setFilter] = useState<'all' | 'unassigned' | 'notInTop5' | 'manual'>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Student | null>(null);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter === 'unassigned' && r.assignment.projectId !== null) return false;
      if (filter === 'notInTop5' && (!r.assignment.projectId || r.assignment.priorityRank !== null))
        return false;
      if (filter === 'manual' && !r.assignment.manuallyEdited) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.student.firstName.toLowerCase().includes(q) ||
          r.student.lastName.toLowerCase().includes(q) ||
          r.student.className.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rows, filter, search]);

  function handleChange(studentId: string, projectId: string) {
    move(studentId, projectId === '__none__' ? null : projectId);
  }

  if (rows.length === 0) {
    return <p className="text-muted-foreground">{t('distribution.table.emptyMessage')}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-3 size-4 text-prose-soft"
          />
          <Input
            aria-label={t('distribution.table.searchPlaceholder')}
            placeholder={t('distribution.table.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <Select
          value={filter}
          onValueChange={(v) => setFilter(v as 'all' | 'unassigned' | 'notInTop5' | 'manual')}
        >
          <SelectTrigger aria-label={t('distribution.table.filterLabel')} className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('distribution.table.filterAll')}</SelectItem>
            <SelectItem value="unassigned">{t('distribution.table.filterUnassigned')}</SelectItem>
            <SelectItem value="notInTop5">{t('distribution.table.filterNotInTop5')}</SelectItem>
            <SelectItem value="manual">{t('distribution.table.filterManual')}</SelectItem>
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs tabular-nums text-prose-soft">
          {filtered.length} / {rows.length}
        </span>
      </div>
      <div className="overflow-hidden border border-rule rounded-lg bg-white">
        <Table>
          <TableHeader className="bg-mark/[0.04] [&_th]:text-[10px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-prose-soft">
            <TableRow>
              <TableHead>{t('distribution.table.headers.student')}</TableHead>
              <TableHead>{t('distribution.table.headers.class')}</TableHead>
              <TableHead className="hidden lg:table-cell">
                {t('distribution.table.headers.grade')}
              </TableHead>
              <TableHead className="hidden xl:table-cell">
                {t('distribution.table.headers.priorities')}
              </TableHead>
              <TableHead>{t('distribution.table.headers.assigned')}</TableHead>
              <TableHead>{t('distribution.table.headers.rank')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-prose-soft">
                  {t('distribution.table.noResults')}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r) => {
              const compatProjects = projects.filter((p) => p.grades.includes(r.student.grade));
              const incompatible = projects.filter((p) => !p.grades.includes(r.student.grade));
              return (
                <TableRow
                  key={r.student.id}
                  className={r.assignment.manuallyEdited ? 'bg-mark/[0.025]' : ''}
                >
                  <TableCell className="font-medium">
                    <button
                      type="button"
                      className="rounded-sm text-left hover:text-mark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => setEditing(r.student)}
                    >
                      {r.student.lastName}, {r.student.firstName}
                    </button>
                  </TableCell>
                  <TableCell>{r.student.className}</TableCell>
                  <TableCell className="hidden lg:table-cell">{r.student.grade}</TableCell>
                  <TableCell className="hidden max-w-[320px] xl:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {r.student.priorities.map((id, i) => {
                        const name = projects.find((p) => p.id === id)?.name ?? '?';
                        const assigned = r.assignment.projectId === id;
                        return (
                          <Badge
                            key={id + i}
                            variant={assigned ? 'secondary' : 'outline'}
                            className={cn(
                              'rounded-sm text-[10px] py-0 px-1.5 font-normal gap-1',
                              assigned && 'border-mark/20 bg-mark/[0.06] text-mark-ink',
                            )}
                          >
                            <span className="text-muted-foreground tabular-nums">{i + 1}.</span>
                            <span className="truncate max-w-[120px]">{name}</span>
                          </Badge>
                        );
                      })}
                      {r.student.priorities.length === 0 && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={r.assignment.projectId ?? '__none__'}
                      onValueChange={(v) => handleChange(r.student.id, v)}
                    >
                      <SelectTrigger
                        aria-label={t('distribution.table.assignmentLabel', {
                          name: `${r.student.firstName} ${r.student.lastName}`,
                        })}
                        className="w-44 border-transparent bg-transparent hover:border-input hover:bg-white focus:border-mark lg:w-56"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">
                          {t('distribution.table.unassignedOption')}
                        </SelectItem>
                        {compatProjects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                        {incompatible.length > 0 && (
                          <>
                            <div className="px-2 py-1 text-xs text-muted-foreground">
                              {t('distribution.table.gradeIncompatible')}
                            </div>
                            {incompatible.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} ⚠
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <AssignmentBadge
                      student={r.student}
                      assignment={r.assignment}
                      projects={projects}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <StudentFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        initial={editing ?? undefined}
        onSave={(data) => {
          if (!editing) return;
          updateStudent(editing.id, data);
          toast.success(t('distribution.studentUpdated'));
          setEditing(null);
        }}
      />
    </div>
  );
}
