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
import { matchesStudent } from '@/lib/studentSearch';
import { Button } from '@/components/ui/button';
import type { Project, Student } from '@/types';

// ponytail: plain paging instead of virtualization; rows render in steps of 100.
const PAGE_SIZE = 100;

export function TableView() {
  const { t } = useTranslation('app');
  const { rows, projects } = useDistributionData();
  const move = useManualAssignment(rows, projects);
  const updateStudent = useStudentsStore((s) => s.updateStudent);
  const [filter, setFilter] = useState<'all' | 'unassigned' | 'notInTop5' | 'manual'>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Student | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter === 'unassigned' && r.assignment.projectId !== null) return false;
      if (filter === 'notInTop5' && (!r.assignment.projectId || r.assignment.priorityRank !== null))
        return false;
      if (filter === 'manual' && !r.assignment.manuallyEdited) return false;
      return matchesStudent(r.student, search);
    });
  }, [rows, filter, search]);

  const projectName = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);
  // Rows share option lists per grade instead of filtering all projects for every row.
  const optionsForGrade = useMemo(() => {
    const cache = new Map<number, { compatible: Project[]; incompatible: Project[] }>();
    return (grade: number) => {
      let options = cache.get(grade);
      if (!options) {
        options = {
          compatible: projects.filter((p) => p.grades.includes(grade)),
          incompatible: projects.filter((p) => !p.grades.includes(grade)),
        };
        cache.set(grade, options);
      }
      return options;
    };
  }, [projects]);

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
            type="search"
            aria-label={t('students.search.label')}
            placeholder={t('students.search.placeholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisible(PAGE_SIZE);
            }}
            className="pl-9 bg-white"
          />
        </div>
        <Select
          value={filter}
          onValueChange={(v) => {
            setFilter(v as 'all' | 'unassigned' | 'notInTop5' | 'manual');
            setVisible(PAGE_SIZE);
          }}
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
            {filtered.slice(0, visible).map((r) => {
              const { compatible, incompatible } = optionsForGrade(r.student.grade);
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
                        const name = projectName.get(id) ?? '?';
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
                    {/* ponytail: native select on purpose — a Radix Select mounts all of its items
                        even while closed, which costs rows × projects components. */}
                    <select
                      value={r.assignment.projectId ?? '__none__'}
                      onChange={(e) => handleChange(r.student.id, e.target.value)}
                      aria-label={t('distribution.table.assignmentLabel', {
                        name: `${r.student.firstName} ${r.student.lastName}`,
                      })}
                      className="select-native w-44 truncate border-transparent bg-transparent hover:border-input hover:bg-white focus:border-mark lg:w-56"
                    >
                      <option value="__none__">{t('distribution.table.unassignedOption')}</option>
                      {compatible.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                      {incompatible.length > 0 && (
                        <optgroup label={t('distribution.table.gradeIncompatible')}>
                          {incompatible.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ⚠
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
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
      {filtered.length > visible && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setVisible((count) => count + PAGE_SIZE)}>
            {t('students.showMore', { count: Math.min(PAGE_SIZE, filtered.length - visible) })}
          </Button>
        </div>
      )}

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
