import { useEffect, useState } from 'react';
import { writeFile } from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';
import {
  BOARD_SORT_LABELS, BOARD_SORT_STORAGE_KEY, readStoredSortKey,
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
import { Download } from 'lucide-react';
import { toast } from 'sonner';

const TAB_STORAGE_KEY = 'distribution.activeTab';

export default function DistributionPage() {
  const navigate = useNavigate();
  const students = useStudentsStore((s) => s.students);
  const projects = useProjectsStore((s) => s.projects);
  const activeDist = useActiveDistribution();
  const { stale, reason } = useStaleAssignments();

  const [tab, setTab] = useState<string>(() => {
    if (typeof window === 'undefined') return 'board';
    const stored = window.localStorage.getItem(TAB_STORAGE_KEY);
    return stored === 'table' || stored === 'board' ? stored : 'board';
  });
  useEffect(() => {
    try { window.localStorage.setItem(TAB_STORAGE_KEY, tab); } catch { /* ignore */ }
  }, [tab]);

  const [sortKey, setSortKey] = useState<BoardSortKey>(() => readStoredSortKey());
  useEffect(() => {
    try { window.localStorage.setItem(BOARD_SORT_STORAGE_KEY, sortKey); } catch { /* ignore */ }
  }, [sortKey]);

  function handleExport() {
    if (!activeDist) return;
    const wb = buildExportWorkbook(students, projects, activeDist.assignments);
    const date = new Date().toISOString().slice(0, 10);
    const slug = activeDist.name
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    writeFile(wb, `projektverteilung-${slug || 'verteilung'}-${date}.xlsx`);
    toast.success('Excel-Export gestartet');
  }

  return (
    <div className="max-w-screen-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Verteilung</h1>
        <Button onClick={handleExport} disabled={!activeDist || activeDist.assignments.length === 0}>
          <Download className="size-4 mr-2" />Excel exportieren
        </Button>
      </div>
      <DistributionSelector />
      {stale && (
        <div className="border border-amber-400 bg-amber-50 text-amber-900 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm">⚠ {reason} — Verteilung ist möglicherweise nicht mehr aktuell.</span>
          <Button size="sm" variant="outline" onClick={() => navigate('/optimize')}>Neu berechnen</Button>
        </div>
      )}
      <StatsPanel />
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="board">Projekte</TabsTrigger>
            <TabsTrigger value="table">Tabelle</TabsTrigger>
          </TabsList>
          {tab === 'board' && (
            <div className="flex items-center gap-2">
              <ArrowUpDown className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Sortieren:</span>
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as BoardSortKey)}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(BOARD_SORT_LABELS) as BoardSortKey[]).map((k) => (
                    <SelectItem key={k} value={k}>{BOARD_SORT_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <TabsContent value="board"><BoardView sortKey={sortKey} /></TabsContent>
        <TabsContent value="table"><TableView /></TabsContent>
      </Tabs>
    </div>
  );
}
