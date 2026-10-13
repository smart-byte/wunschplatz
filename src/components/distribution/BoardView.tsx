import { Children, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, TriangleAlert } from 'lucide-react';
import { needsAttention } from '@/lib/distribution';
import { matchesStudent } from '@/lib/studentSearch';
import {
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import { useDistributionData } from '@/hooks/useDistributionData';
import { useManualAssignment } from '@/hooks/useManualAssignment';
import { useStudentsStore } from '@/store/useStudentsStore';
import { ProjectCard } from './ProjectCard';
import { StudentChip } from './StudentChip';
import { StudentFormDialog } from '@/components/students/StudentFormDialog';
import { toast } from 'sonner';
import type { Project, Student } from '@/types';
import type { BoardSortKey } from './boardSort';

const UNASSIGNED_ID = '__unassigned__';

function compareStr(a: string, b: string, language: string): number {
  return a.localeCompare(b, language, { sensitivity: 'base', numeric: true });
}

type Props = { sortKey: BoardSortKey };

export function BoardView({ sortKey }: Props) {
  const { t, i18n } = useTranslation('app');
  const { rows, projects } = useDistributionData();
  const move = useManualAssignment(rows, projects);
  const updateStudent = useStudentsStore((s) => s.updateStudent);
  const [editing, setEditing] = useState<Student | null>(null);
  const [query, setQuery] = useState('');
  const [attentionOnly, setAttentionOnly] = useState(false);

  // Leave room for clicks before starting a drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(e: DragEndEvent) {
    const studentId = e.active.id as string;
    const targetId = e.over?.id as string | undefined;
    if (!targetId) return;
    move(studentId, targetId === UNASSIGNED_ID ? null : targetId);
  }

  const byProject = useMemo(() => {
    const grouped = new Map<string, typeof rows>();
    for (const row of rows) {
      if (!row.assignment.projectId) continue;
      const id = row.assignment.projectId;
      if (!grouped.has(id)) grouped.set(id, []);
      grouped.get(id)!.push(row);
    }
    return grouped;
  }, [rows]);
  const unassigned = rows.filter((r) => !r.assignment.projectId);

  const popularityRanking = useMemo(
    () =>
      projects
        .map((project) => ({
          project,
          score: rows.reduce((total, { student }) => {
            const rank = student.priorities.indexOf(project.id);
            return total + (rank >= 0 && rank < 5 ? 5 - rank : 0);
          }, 0),
        }))
        .sort((a, b) => b.score - a.score),
    [projects, rows],
  );

  const sortedProjects = useMemo(() => {
    const copy = [...projects];
    const popularityById = new Map(
      popularityRanking.map(({ project, score }) => [project.id, score]),
    );
    const loadOf = (p: Project) => byProject.get(p.id)?.length ?? 0;
    const language = i18n.resolvedLanguage ?? i18n.language;
    copy.sort((a, b) => {
      switch (sortKey) {
        case 'popularity':
          return (
            (popularityById.get(b.id) ?? 0) - (popularityById.get(a.id) ?? 0) ||
            compareStr(a.name, b.name, language)
          );
        case 'name':
          return compareStr(a.name, b.name, language);
        case 'load':
          return loadOf(b) - loadOf(a) || compareStr(a.name, b.name, language);
        case 'utilization': {
          const ua = a.maxCapacity > 0 ? loadOf(a) / a.maxCapacity : 0;
          const ub = b.maxCapacity > 0 ? loadOf(b) / b.maxCapacity : 0;
          return ub - ua || compareStr(a.name, b.name, language);
        }
        case 'grade': {
          const ga = Math.min(...a.grades);
          const gb = Math.min(...b.grades);
          return ga - gb || compareStr(a.name, b.name, language);
        }
      }
    });
    return copy;
  }, [projects, byProject, sortKey, popularityRanking, i18n.resolvedLanguage, i18n.language]);

  const attention = useMemo(
    () =>
      new Set(
        projects.filter((p) => needsAttention(p, byProject.get(p.id) ?? [])).map((p) => p.id),
      ),
    [projects, byProject],
  );
  // Cards keep their full counts; a search only narrows which students they list.
  const cards = sortedProjects.flatMap((project) => {
    const assigned = byProject.get(project.id) ?? [];
    if (attentionOnly && !attention.has(project.id)) return [];
    const listed = query ? assigned.filter((r) => matchesStudent(r.student, query)) : assigned;
    return query && !listed.length ? [] : [{ project, assigned, listed }];
  });
  const unassignedListed = query
    ? unassigned.filter((r) => matchesStudent(r.student, query))
    : unassigned;
  const showUnassigned = query
    ? unassignedListed.length > 0
    : !attentionOnly || unassigned.length > 0;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="mb-5 flex flex-wrap items-center gap-3">
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
            onChange={(e) => setQuery(e.target.value)}
            className="bg-white pl-9"
          />
        </div>
        <Button
          variant="outline"
          aria-pressed={attentionOnly}
          onClick={() => setAttentionOnly((on) => !on)}
          className="aria-pressed:border-amber-400 aria-pressed:bg-amber-50 aria-pressed:text-amber-900"
        >
          <TriangleAlert />
          {t('distribution.board.attentionOnly')}
          <span className="tabular-nums text-prose-soft">{attention.size}</span>
        </Button>
        <p className="w-full text-xs leading-relaxed text-prose-soft">
          {t('distribution.board.help')}
        </p>
      </div>
      {showUnassigned && (
        <UnassignedDroppable count={unassigned.length}>
          {unassignedListed.map((r) => (
            <StudentChip
              key={r.student.id}
              student={r.student}
              assignment={r.assignment}
              projects={projects}
              onClick={() => setEditing(r.student)}
            />
          ))}
        </UnassignedDroppable>
      )}
      {cards.length === 0 && (
        <p className="py-12 text-center text-sm text-prose-soft">
          {t('distribution.board.noMatches')}
        </p>
      )}
      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ project, assigned, listed }) => (
          <ProjectCard
            key={project.id}
            project={project}
            allProjects={projects}
            allRows={rows}
            popularityRanking={popularityRanking}
            students={assigned}
            listed={listed}
            onStudentClick={setEditing}
          />
        ))}
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
    </DndContext>
  );
}

function UnassignedDroppable({ children, count }: { children: React.ReactNode; count: number }) {
  const { t } = useTranslation('app');
  const { setNodeRef, isOver } = useDroppable({ id: UNASSIGNED_ID });
  const [expanded, setExpanded] = useState(false);
  const items = Children.toArray(children);
  return (
    <div
      ref={setNodeRef}
      className={`mb-6 rounded-lg border border-dashed p-5 ${isOver ? 'border-mark bg-mark/[0.04]' : count ? 'border-amber-400 bg-amber-50/40' : 'border-rule bg-white'}`}
    >
      <h3 className="font-serif text-xl text-mark-ink">
        {t('distribution.board.unassignedHeading')}{' '}
        <span className="ml-2 font-sans text-sm tabular-nums text-prose-soft">{count}</span>
      </h3>
      <div className="mt-3 grid gap-x-6 sm:grid-cols-2 xl:grid-cols-3">
        {expanded ? items : items.slice(0, 6)}
      </div>
      {count > 6 && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 text-xs text-amber-800"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? t('distribution.board.showLess') : t('distribution.board.showAll', { count })}
        </Button>
      )}
      {count === 0 && (
        <p className="text-xs text-prose-soft">{t('distribution.board.allAssigned')}</p>
      )}
    </div>
  );
}
