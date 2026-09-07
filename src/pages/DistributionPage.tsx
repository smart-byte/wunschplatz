import { useEffect, useState } from 'react';
import { writeFile } from 'xlsx';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown, LayoutGrid, List, TriangleAlert } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  BOARD_SORT_LABEL_KEYS,
  BOARD_SORT_STORAGE_KEY,
  readStoredSortKey,
  type BoardSortKey,
} from '@/components/distribution/boardSort';
import { Button } from '@/components/ui/button';
import { TableView } from '@/components/distribution/TableView';
import { BoardView } from '@/components/distribution/BoardView';
import { StatsPanel } from '@/components/distribution/StatsPanel';
import { DistributionSelector } from '@/components/distribution/DistributionSelector';
import { buildExportWorkbook } from '@/excel/exportDistribution';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useActiveDistribution } from '@/store/useAssignmentsStore';
import { useStaleAssignments } from '@/hooks/useStaleAssignments';
import { Download, ListChecks } from 'lucide-react';
import { toast } from 'sonner';

const TAB_STORAGE_KEY = 'distribution.activeTab.v2';

export default function DistributionPage() {
  const { t, i18n } = useTranslation('app');
  const navigate = useNavigate();
  const students = useStudentsStore((s) => s.students);
  const projects = useProjectsStore((s) => s.projects);
  const activeDist = useActiveDistribution();
  const { stale, reasonKey } = useStaleAssignments();

  const [tab, setTab] = useState<string>(() => {
    if (typeof window === 'undefined') return 'board';
    try {
      const stored = window.localStorage.getItem(TAB_STORAGE_KEY);
      return stored === 'table' || stored === 'board' ? stored : 'board';
    } catch {
      return 'board';
    }
  });
  const [sortKey, setSortKey] = useState<BoardSortKey>(readStoredSortKey);

  useEffect(() => {
    try {
      window.localStorage.setItem(TAB_STORAGE_KEY, tab);
      window.localStorage.setItem(BOARD_SORT_STORAGE_KEY, sortKey);
    } catch {
      // Keep preferences in memory when browser storage is unavailable.
    }
  }, [tab, sortKey]);

  const hasProjects = projects.length > 0;
  const hasStudents = students.length > 0;

  function handleExport() {
    if (!activeDist) return;
    const wb = buildExportWorkbook(
      students,
      projects,
      activeDist.assignments,
      i18n.resolvedLanguage ?? i18n.language,
    );
    const date = new Date().toISOString().slice(0, 10);
    const slug = activeDist.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    writeFile(wb, `wunschplatz-${slug || t('distribution.exportFileFallback')}-${date}.xlsx`);
    toast.success(t('distribution.exportStarted'));
  }

  if (!hasProjects || !hasStudents) {
    const linkClass = 'text-primary underline underline-offset-2 hover:text-primary/80';
    const emptyMessageKey =
      !hasProjects && !hasStudents
        ? 'distribution.empty.bothMissing'
        : !hasProjects
          ? 'distribution.empty.projectsMissing'
          : 'distribution.empty.studentsMissing';
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <ListChecks className="size-10 text-mark/60" />
        <div className="space-y-1">
          <h1 className="page-title">{t('distribution.empty.heading')}</h1>
          <p className="text-muted-foreground">
            <Trans
              t={t}
              i18nKey={emptyMessageKey}
              components={{
                projectsLink: <Link to="/projects" className={linkClass} />,
                studentsLink: <Link to="/students" className={linkClass} />,
              }}
            />
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {!hasProjects && (
            <Button asChild variant={hasStudents ? 'default' : 'outline'}>
              <Link to="/projects">{t('distribution.empty.goToProjects')}</Link>
            </Button>
          )}
          {!hasStudents && (
            <Button asChild>
              <Link to="/students">{t('distribution.empty.goToStudents')}</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6">
      <PageHeader
        title={t('distribution.title')}
        kicker={t('distribution.kicker')}
        description={t('distribution.description')}
        actions={
          <Button
            onClick={handleExport}
            disabled={!activeDist || activeDist.assignments.length === 0}
          >
            <Download className="size-4" />
            {t('distribution.exportExcel')}
          </Button>
        }
      />
      <DistributionSelector />
      {stale && (
        <div className="border-l-2 border-amber-500 bg-amber-50 text-amber-900 p-4 flex flex-wrap items-center justify-between gap-3">
          <span className="flex flex-1 items-start gap-2 text-sm leading-relaxed">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {t('distribution.stale.warning', { reason: reasonKey ? t(reasonKey) : '' })}
          </span>
          <Button size="sm" variant="outline" onClick={() => navigate('/optimize')}>
            {t('distribution.stale.recalculate')}
          </Button>
        </div>
      )}
      <StatsPanel />
      <Tabs value={tab} onValueChange={setTab}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <TabsList className="h-11 gap-1 border border-rule bg-white p-1">
            <TabsTrigger
              className="gap-2 data-[state=active]:bg-mark/[0.08] data-[state=active]:text-mark data-[state=active]:shadow-none"
              value="board"
            >
              <LayoutGrid className="size-4" />
              {t('distribution.tabs.board')}
            </TabsTrigger>
            <TabsTrigger
              className="gap-2 data-[state=active]:bg-mark/[0.08] data-[state=active]:text-mark data-[state=active]:shadow-none"
              value="table"
            >
              <List className="size-4" />
              {t('distribution.tabs.table')}
            </TabsTrigger>
          </TabsList>
          {tab === 'board' && (
            <div className="flex items-center gap-2">
              <ArrowUpDown className="size-4 text-muted-foreground" />
              <span className="hidden text-sm text-prose-soft sm:inline">
                {t('distribution.sort.label')}
              </span>
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as BoardSortKey)}>
                <SelectTrigger aria-label={t('distribution.sort.label')} className="w-44 sm:w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(BOARD_SORT_LABEL_KEYS) as BoardSortKey[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {t(BOARD_SORT_LABEL_KEYS[k])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <TabsContent value="board">
          <p className="mb-5 text-xs leading-relaxed text-prose-soft">
            {t('distribution.board.help')}
          </p>
          <BoardView sortKey={sortKey} />
        </TabsContent>
        <TabsContent value="table">
          <TableView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
